const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const {amount, currency, items} = req.body; // amount in INR paisa (100 = ₹1)
        const options = {
            amount: amount, // convert to paisa
            currency: currency || "INR",
            receipt: "order_rcptid_" + Date.now(),
        };

        const razorpayOrder = await razorpay.orders.create(options);
        const order = new Order({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            amount_due: razorpayOrder.amount_due,
            amount_paid: razorpayOrder.amount_paid || 0,
            attempts: razorpayOrder.attempts || 0,
            created_at: razorpayOrder.created_at,
            currency: razorpayOrder.currency,
            entity: razorpayOrder.entity,
            receipt: razorpayOrder.receipt,
            status: razorpayOrder.status,
            items: items,
            userId: req.user._id,
            shippingAddress: {
                name: "John Doe",
                phone: "9876543210",
                address: "123 MG Road",
                city: "Udaipur",
                state: "Rajasthan",
                postalCode: "313001",
                country: "India",
            },
            // orderStatus: 'pending',
            /*payment: {
                status: 'created',
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }*/
        });

        const savedOrder = await order.save();

        res.status(201).json({
            success: true,
            order: razorpayOrder,
            razorpayOrderId: razorpayOrder.id
        });
        res.json(razorpayOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({success: true, message: "Payment verified successfully"});
        } else {
            return res.status(400).json({success: false, message: "Invalid signature"});
        }
    } catch (err) {
        res.status(500).json({error: "Verification failed"});
    }
};

exports.getOrder = async (req, res) => {
    try {
        const {id} = req.params;
        const order = await Order.findOne({id});

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            order
        });

    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to fetch order'
        });
    }
};
