const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');

// All routes are protected and require authentication
router.route('/')
  .get(protect, getCart)
  .delete(protect, clearCart);

router.route('/items')
  .post(protect, addToCart);

router.route('/items/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

module.exports = router;
