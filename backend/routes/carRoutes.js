const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { protect, restrictTo } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router
  .route('/')
  .get(carController.getAllCars)
  .post(
    protect,
    restrictTo('admin'),
    upload.array('images', 5),
    carController.createCar
  );

router
  .route('/:id')
  .get(carController.getCar)
  .patch(protect, restrictTo('admin'), carController.updateCar)
  .delete(protect, restrictTo('admin'), carController.deleteCar);

router.route('/stats').get(carController.getCarStats);

module.exports = router;