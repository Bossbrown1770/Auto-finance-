const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router
  .route('/users')
  .get(adminController.getAllUsers);

router
  .route('/admins')
  .post(adminController.createAdmin);

router.get('/status', adminController.getSystemStatus);

module.exports = router;