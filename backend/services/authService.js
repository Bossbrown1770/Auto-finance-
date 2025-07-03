const API_BASE = import.meta.env.VITE_API_BASE;

export default {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    secureStoreAuthData(data);
  },

  async registerAdmin(adminData, token) {
    const response = await fetch(`${API_BASE}/auth/register-admin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(adminData)
    });
    
    // ... error handling
  }
};

function secureStoreAuthData(data) {
  // Secure storage methods
  localStorage.setItem('jwt', data.token);
  sessionStorage.setItem('user', JSON.stringify(data.user));
  document.cookie = `refreshToken=${data.refreshToken}; Secure; HttpOnly; SameSite=Strict`;
}

const User = require('../models/User');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.register = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
    }

    // Create new user
    const newUser = await User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone
    });

    return newUser;
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

exports.login = async (email, password) => {
  try {
    // 1) Check if email and password exist
    if (!email || !password) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide email and password');
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    // 3) Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return user;
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not logged in! Please log in to get access');
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'The user belonging to this token does no longer exist');
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User recently changed password! Please log in again');
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

exports.forgotPassword = async (email) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'There is no user with that email address');
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'There was an error sending the email. Try again later!');
  }
};

exports.resetPassword = async (token, password, passwordConfirm) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Token is invalid or has expired');
    }

    // 3) Update changedPasswordAt property for the user
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4) Log the user in, send JWT
    return user;
  } catch (error) {
    throw error;
  }
};