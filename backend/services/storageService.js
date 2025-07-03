const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const config = require('../config/env');

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

exports.uploadToCloud = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'auto-finance',
    use_filename: true,
    unique_filename: false
  });

  fs.unlinkSync(file.path);

  return result;
};

exports.deleteFromCloud = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};