const Order = require('../models/Order');
const Product = require('../models/Product');
const {validationResult} = require('express-validator');

exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {items, shippingAddress, paymentMethod, totalAmount, tax, shipping} = req.body;
        const userId = req.user.id;

        const productIds = items.map(item => item.productId);
        const products = await Product.find({_id: {$in: productIds}});

        if (products.length !== items.length) {
            return res.status(400).json({message: 'One or more products not found'});
        }

        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.productId);

            if (!product) {
                return res.status(400).json({message: `Product not found: ${item.productId}`});
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product: ${product.name}`,
                    productId: product._id,
                    availableStock: product.stock
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.images[0] || '',
                totalPrice: itemTotal
            });
        }
        const calculatedTotal = subtotal + (tax || 0) + (shipping || 0);

        if (Math.abs(calculatedTotal - totalAmount) > 1) {
            return res.status(400).json({
                message: 'Order total does not match calculated total',
                calculatedTotal,
                providedTotal: totalAmount
            });
        }

        const order = new Order({
            userId,
            items: orderItems,
            subtotal,
            tax: tax || 0,
            shipping: shipping || 0,
            total: totalAmount,
            payment: {
                razorpayOrderId: req.body.razorpayOrderId,
                razorpayPaymentId: req.body.razorpayPaymentId || null,
                razorpaySignature: req.body.razorpaySignature || null,
                status: 'pending',
                amount: totalAmount,
                method: paymentMethod || 'razorpay'
            },
            shippingAddress,
            status: 'pending'
        });

        const savedOrder = await order.save();

        await Promise.all(orderItems.map(async (item) => {
            await Product.findByIdAndUpdate(
                item.productId,
                {$inc: {stock: -item.quantity}}
            );
        }));
        res.status(201).json({
            success: true,
            order: {...items, ...savedOrder},
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('items.productId', 'name price image productId quantity');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const orders = await Order.find({userId: req?.user?._id})
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .populate('items.productId', 'name price image quantity');

        const total = await Order.countDocuments({userId: req?.user?._id});
        res.json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            orders
        });
    } catch (error) {
        console.error('Error getting user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateOrderToPaid = async (req, res) => {
    try {
        const {razorpayPaymentId, razorpayOrderId, razorpaySignature} = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.userId.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        order.payment.razorpayPaymentId = razorpayPaymentId || order.payment.razorpayPaymentId;
        order.payment.razorpaySignature = razorpaySignature || order.payment.razorpaySignature;
        order.payment.status = 'completed';
        order.payment.paidAt = Date.now();

        order.shippingStatus = 'processing';
        order.notes.push({
            text: 'Payment received',
            createdBy: req.user.id
        });

        const updatedOrder = await order.save();

        res.json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order to paid:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.shippingStatus = 'delivered';
        order.deliveredAt = Date.now();
        order.notes.push({
            text: 'Order delivered',
            createdBy: req.user.id
        });

        const updatedOrder = await order.save();

        res.json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order to delivered:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        if (req.query.status) {
            query.status = req.query.status;
        }

        const orders = await Order.find(query)
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('items.productId', 'name price');

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            orders
        });
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
