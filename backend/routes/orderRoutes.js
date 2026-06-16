const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  updatePaymentStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');


router.route('/').get(protect, getOrders).post(protect, createOrder);

router.route('/:id/status').put(protect, updateOrderStatus);
router.route('/:id/payment').put(protect, updatePaymentStatus);

module.exports = router;