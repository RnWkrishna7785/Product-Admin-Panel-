const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Please add customer name'],
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', 
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending', 
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Refunded'],
      default: 'Unpaid',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);