const nodemailer = require('nodemailer');
const config = require('../config/env');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: config.EMAIL_USERNAME,
    pass: config.EMAIL_PASSWORD
  }
});

exports.sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: 'Auto Finance <no-reply@autofinance.com>',
    to: user.email,
    subject: 'Welcome to Auto Finance!',
    text: `Hi ${user.firstName},\n\nWelcome to Auto Finance! We're excited to have you on board.`,
    html: `<h1>Welcome ${user.firstName}!</h1><p>We're excited to have you on board.</p>`
  };

  await transporter.sendMail(mailOptions);
};

exports.sendPasswordReset = async (user, resetUrl) => {
  const mailOptions = {
    from: 'Auto Finance <no-reply@autofinance.com>',
    to: user.email,
    subject: 'Your password reset token (valid for 10 min)',
    text: `Forgot your password? Submit a PATCH request with your new password to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`
  };

  await transporter.sendMail(mailOptions);
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: 'Auto Finance <noreply@autofinance.com>',
    to: user.email,
    subject: 'Welcome to Auto Finance Carsales!',
    text: `Hi ${user.firstName},\n\nWelcome to Auto Finance Carsales!`
  };

  await transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: 'Auto Finance <noreply@autofinance.com>',
    to: user.email,
    subject: 'Your password reset token (valid for 10 min)',
    text: `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`
  };

  await transporter.sendMail(mailOptions);
};