const express = require('express');
const router = express.Router();
const {protect, admin} = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');
const {check} = require('express-validator');

router.post(
    '/',
    protect,
    [
        check('items', 'Order items are required').isArray().notEmpty(),
        check('shippingAddress', 'Shipping address is required').isObject(),
        check('totalAmount', 'Total amount is required').isNumeric(),
        check('paymentMethod', 'Payment method is required').notEmpty(),
        check('items.*.productId', 'Product ID is required').notEmpty(),
        check('items.*.quantity', 'Quantity must be a positive integer').isInt({min: 1})
    ],
    orderController.createOrder
);

router.get('/my-orders', protect, orderController.getMyOrders);

router.get('/:id', protect, orderController.getOrderById);

router.put(
    '/:id/pay',
    protect,
    [
        check('razorpayPaymentId', 'Razorpay payment ID is required').notEmpty(),
        check('razorpayOrderId', 'Razorpay order ID is required').notEmpty(),
        check('razorpaySignature', 'Razorpay signature is required').notEmpty()
    ],
    orderController.updateOrderToPaid
);

router.put('/:id/deliver', protect, orderController.updateOrderToDelivered);

router.get('/', protect, orderController.getOrders);

module.exports = router;
