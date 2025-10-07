const mongoose = require('mongoose');

const specificationsSchema = new mongoose.Schema({
      brand: {type: String},
      model: {type: String},
      color: {type: String},
      size: {type: String},
      weight: {type: Number},
    },
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  imageUrl: [{
    type: String,
  }],
  specifications: specificationsSchema,
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
