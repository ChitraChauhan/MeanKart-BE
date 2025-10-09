const express = require('express');
const { createOrder, verifyPayment, getOrder } = require('../controllers/razorpay');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/order/:id", protect, getOrder);

module.exports = router;
