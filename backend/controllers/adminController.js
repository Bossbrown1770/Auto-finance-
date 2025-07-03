const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.createAdmin = catchAsync(async (req, res, next) => {
  const newAdmin = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: 'admin'
  });

  res.status(201).json({
    status: 'success',
    data: { user: newAdmin }
  });
});

exports.getSystemStatus = async (req, res) => {
  const adminCount = await User.countDocuments({ role: 'admin' });
 
  res.status(200).json({
    status: 'success',
    data: {
      hasAdmin: adminCount > 0
    }
  });
};