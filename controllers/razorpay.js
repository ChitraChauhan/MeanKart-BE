const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        };

        const razorpayOrder = await razorpay.orders.create(options);
        const order = new Order({
            userId: req.user._id,
            amount: req.body.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            razorpayOrderId: razorpayOrder.id,
            status: "created",
            items: req.body.items,
            shippingAddress: req.user.addresses.find(a => a.isDefault) || {
                name: "John Doe",
                phone: "9876543210",
                address: "123 MG Road",
                city: "Udaipur",
                state: "Rajasthan",
                postalCode: "313001",
                country: "India",
            }
        });
        order.save();
        res.json(razorpayOrder);
    } catch (error) {
        res.status(500).send(error);
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
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    $set: {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        status: "paid",
                    },
                }
            );
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
