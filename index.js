require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const startServer = async () => {
    try {
        await connectDB();

        const productRoutes = require('./routes/productRoutes');
        const authRoutes = require('./routes/authRoutes');
        const cartRoutes = require('./routes/cartRoutes');
        const adminRoutes = require('./routes/adminRoutes');
        const userRoutes = require('./routes/userRoutes');
        const paymentRoutes = require('./routes/payment');
        const orderRoutes = require('./routes/orderRoutes');

        app.use('/api/products', productRoutes);
        app.use('/api/auth', authRoutes);
        app.use('/api/cart', cartRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/payment', paymentRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        app.get('/', (req, res) => {
            res.send('E-commerce API is running!');
        });

        // const PORT = process.env.PORT || 5000;
        // app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));

    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Uncomment this only if using Vercel (serverless function handler)
module.exports = app;
