const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price imageUrl');
    
    if (!cart) {
      return res.status(200).json({ items: [], total: 0 });
    }
    
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Get the product to verify it exists and get its price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'ProductModel not found' });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      // Create new cart if it doesn't exist
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }
    
    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex > -1) {
      // Update quantity if item exists
      cart.items[itemIndex].quantity = parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        price: product.price,
        name: product.name,
        image: product.imageUrl[0]
      });
    }
    
    // Save and return updated cart
    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    
    res.status(201).json(updatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();
    
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    res.json(updatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    res.json(updatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(200).json({ message: 'Cart is already empty' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
