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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: false
    },
    tax: {
        type: Number,
        default: 0
    },
    shipping: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    payment: {
        type: paymentDetailsSchema,
        required: false
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid'],
        default: 'created'
    },
    shippingStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'],
        default: 'pending'
    },
    notes: [{
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    trackingNumber: {
        type: String
    },
    trackingCompany: {
        type: String
    },
    trackingUrl: {
        type: String
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledReason: {
        type: String
    },
    deliveredAt: {
        type: Date
    },
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }
    next();
});

orderSchema.index({userId: 1, status: 1});
orderSchema.index({'payment.razorpayOrderId': 1});
orderSchema.index({'payment.razorpayPaymentId': 1});
orderSchema.index({createdAt: -1});

orderSchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

orderSchema.virtual('statusDisplay').get(function () {
    const statusMap = {
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'refunded': 'Refunded',
        'failed': 'Failed'
    };
    return statusMap[this.status] || this.status;
});

orderSchema.statics.findByRazorpayOrderId = function (razorpayOrderId) {
    return this.findOne({'payment.razorpayOrderId': razorpayOrderId});
};

orderSchema.methods.updateStatus = async function (newStatus, userId = null) {
    const allowedStatuses = ['processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (allowedStatuses.includes(newStatus)) {
        this.status = newStatus;

        if (newStatus === 'cancelled') {
            this.cancelledAt = new Date();
            this.cancelledBy = userId;
        } else if (newStatus === 'delivered') {
            this.deliveredAt = new Date();
        }

        this.notes.push({
            text: `Order status changed to ${newStatus}`,
            createdBy: userId
        });

        await this.save();
        return this;
    }

    throw new Error('Invalid status update');
};

module.exports = mongoose.model('Order', orderSchema);
