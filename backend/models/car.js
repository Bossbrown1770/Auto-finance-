const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  downPayment: {
    type: Number,
    required: [true, 'Down payment is required'],
    min: [0, 'Down payment cannot be negative']
  },
  monthlyPayment: {
    type: Number,
    required: [true, 'Monthly payment is required'],
    min: [0, 'Monthly payment cannot be negative']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },
  type: {
    type: String,
    enum: ['sedan', 'suv', 'truck', 'coupe', 'convertible'],
    required: [true, 'Type is required']
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual', 'cvt', 'dual-clutch', 'automated-manual'],
    required: [true, 'Transmission is required']
  },
  color: {
    type: String,
    required: [true, 'Color is required']
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'hybrid', 'electric'],
    required: [true, 'Fuel type is required']
  },
  features: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    required: [true, 'At least one image is required']
  },
  details: {
    type: String,
    required: [true, 'Details are required']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isReserved: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
CarSchema.index({ make: 1, model: 1 });
CarSchema.index({ price: 1 });
CarSchema.index({ year: -1 });

module.exports = mongoose.model('Car', CarSchema);