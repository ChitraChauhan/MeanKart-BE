const mongoose = require("mongoose");

let isConnected = false;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean-ecommerce';

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(MONGODB_URI);
        isConnected = conn.connections[0].readyState;
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
    }
};

module.exports = connectDB;
