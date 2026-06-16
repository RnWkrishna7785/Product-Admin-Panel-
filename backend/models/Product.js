const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please add an SKU (Stock Keeping Unit)'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      default: 0.0,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    imageUrl: {
      type: String,
      default: '', 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);