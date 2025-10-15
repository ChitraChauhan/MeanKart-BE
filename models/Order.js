const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: {
        type: String,
        required: true
    }
});

const paymentDetailsSchema = new mongoose.Schema({
    razorpayOrderId: {
        type: String,
        required: true
    },
    razorpayPaymentId: {
        type: String,
        required: true
    },
    razorpaySignature: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    method: {
        type: String
    },
    bank: {
        type: String
    },
    wallet: {
        type: String
    },
    cardId: {
        type: String
    },
    vpa: {
        type: String
    },
    email: {
        type: String
    },
    contact: {
        type: String
    },
    fee: {
        type: Number
    },
    tax: {
        type: Number
    },
    errorCode: {
        type: String
    },
    errorDescription: {
        type: String
    }
}, {_id: false});

const shippingAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: 'India'
    }
}, {_id: false});

const orderSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        receipt: { type: String },
        razorpayOrderId: { type: String, required: true },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        items: [orderItemSchema],
        shippingAddress: {
            type: shippingAddressSchema,
        },
        status: {
            type: String,
            enum: ["created", "paid", "attempted"],
            default: "created",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
