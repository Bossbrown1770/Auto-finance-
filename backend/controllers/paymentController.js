const Payment = require('../models/Payment');
const Car = require('../models/Car');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPayment = catchAsync(async (req, res, next) => {
  const { carId, paymentMethod, amount, customerDetails } = req.body;

  const car = await Car.findById(carId);
  if (!car) {
    return next(new AppError('No car found with that ID', 404));
  }

  const payment = await Payment.create({
    user: req.user.id,
    car: carId,
    amount,
    paymentMethod,
    customerDetails
  });

  res.status(201).json({
    status: 'success',
    data: {
      payment
    }
  });
});

exports.processStripePayment = catchAsync(async (req, res, next) => {
  const { paymentId, token } = req.body;

  const payment = await Payment.findById(paymentId).populate('car');
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }

  const charge = await stripe.charges.create({
    amount: payment.amount * 100, // convert to cents
    currency: 'usd',
    description: `Payment for ${payment.car.make} ${payment.car.model}`,
    source: token
  });

  payment.status = 'completed';
  payment.stripeChargeId = charge.id;
  await payment.save();

  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

exports.getUserPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id }).populate('car');

  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments
    }
  });
});