const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

router
  .route('/')
  .post(protect, paymentController.createPayment)
  .get(protect, paymentController.getUserPayments);

router.post('/stripe', protect, paymentController.processStripePayment);

module.exports = router;