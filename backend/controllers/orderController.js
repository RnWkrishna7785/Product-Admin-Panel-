const Order = require('../models/Order');
const Product = require('../models/Product');


const createOrder = async (req, res) => {
  try {
    const { customerName, orderItems, totalPrice, paymentStatus } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }


    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for "${product.name}". Available: ${product.stock}`,
        });
      }
    }

    const order = new Order({
      customerName,
      orderItems,
      totalPrice,
      paymentStatus,
    });

    const createdOrder = await order.save();


    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('orderItems.product', 'name sku price')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;


    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

  
    if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product && product.stock < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock to reactivate order. "${product.name}" only has ${product.stock} in stock.`,
          });
        }
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  updatePaymentStatus,
};