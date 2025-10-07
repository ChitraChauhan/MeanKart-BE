const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    }
}, {timestamps: true});

// Encrypt password before saving
// In server/models/User.js
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
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

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
};

// Add a method to update lastActive
userSchema.methods.updateLastActive = async function() {
    this.lastActive = Date.now();
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
