const Car = require('../models/Car');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const uploadImage = require('../utils/uploadImage');

exports.getAllCars = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Car.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const cars = await features.query;

  res.status(200).json({
    status: 'success',
    results: cars.length,
    data: {
      cars
    }
  });
});

exports.getCar = catchAsync(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) {
    return next(new AppError('No car found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      car
    }
  });
});

exports.createCar = catchAsync(async (req, res, next) => {
  // Upload images to Cloudinary
  const imageUrls = [];
  if (req.files && req.files.images) {
    for (const file of req.files.images) {
      const result = await uploadImage(file.path);
      imageUrls.push(result.secure_url);
    }
  }

  const carData = {
    ...req.body,
    images: imageUrls
  };

  const newCar = await Car.create(carData);

  res.status(201).json({
    status: 'success',
    data: {
      car: newCar
    }
  });
});

exports.updateCar = catchAsync(async (req, res, next) => {
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!car) {
    return next(new AppError('No car found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      car
    }
  });
});

exports.deleteCar = catchAsync(async (req, res, next) => {
  const car = await Car.findByIdAndDelete(req.params.id);

  if (!car) {
    return next(new AppError('No car found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getCarStats = catchAsync(async (req, res, next) => {
  const stats = await Car.aggregate([
    {
      $match: { price: { $gte: 1000 } }
    },
    {
      $group: {
        _id: '$make',
        numCars: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});