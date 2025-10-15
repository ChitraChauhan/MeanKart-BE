const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        match: [/^[0-9]{5,10}$/, 'Please enter a valid postal code']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    addresses: [addressSchema]
}, {timestamps: true});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
};

userSchema.methods.updateLastActive = async function () {
    this.lastActive = Date.now();
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
