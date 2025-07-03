const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Car = require('../models/Car');
const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Payment page
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      req.flash('error_msg', 'Car not found');
      return res.redirect('/inventory');
    }
    
    res.render('payment', { 
      title: 'Complete Your Purchase',
      car,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading payment page');
    res.redirect('/inventory');
  }
});

// Process payment
router.post('/process', ensureAuthenticated, async (req, res) => {
  try {
    const { carId, paymentMethod, submissionMethod, firstName, lastName, email, phone } = req.body;
    
    // Validate inputs
    if (!carId || !paymentMethod || !submissionMethod || !firstName || !lastName || !email || !phone) {
      req.flash('error_msg', 'Please fill all required fields');
      return res.redirect(`/payment/${carId}`);
    }
    
    // Get car details
    const car = await Car.findById(carId);
    if (!car) {
      req.flash('error_msg', 'Car not found');
      return res.redirect('/inventory');
    }
    
    // Calculate totals
    const tax = car.price * 0.07;
    const total = car.price + tax + 150 + 85; // Price + tax + doc fee + registration
    
    // Create payment record
    const payment = new Payment({
      user: req.user.id,
      car: carId,
      amount: total,
      paymentMethod,
      submissionMethod,
      status: 'pending',
      customerDetails: {
        firstName,
        lastName,
        email,
        phone
      }
    });
    
    await payment.save();
    
    // Process payment based on method
    if (paymentMethod === 'creditcard') {
      // Process with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // in cents
        currency: 'usd',
        description: `Purchase of ${car.year} ${car.make} ${car.model}`,
        metadata: {
          carId: car._id.toString(),
          userId: req.user._id.toString()
        }
      });
      
      // Redirect to Stripe payment page
      res.redirect(`/payment/confirm/${payment._id}?client_secret=${paymentIntent.client_secret}`);
    } else {
      // For other payment methods (Cash App, Zelle, etc.)
      // Mark as pending and notify admin
      payment.status = 'pending_verification';
      await payment.save();
      
      // TODO: Send notification to admin
      
      req.flash('success_msg', 'Your payment request has been submitted. We will contact you shortly.');
      res.redirect('/thank-you');
    }
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment processing failed');
    res.redirect(`/payment/${req.body.carId}`);
  }
});

// Payment confirmation
router.get('/confirm/:id', ensureAuthenticated, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('car')
      .populate('user');
      
    if (!payment || payment.user._id.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Invalid payment');
      return res.redirect('/inventory');
    }
    
    res.render('payment-confirm', {
      title: 'Confirm Payment',
      payment,
      clientSecret: req.query.client_secret,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading payment confirmation');
    res.redirect('/inventory');
  }
});

module.exports = router;