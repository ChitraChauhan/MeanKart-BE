const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require("mongoose");

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        lastActive: updatedUser.lastActive,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/admin/products
// @desc    Create a product
// @access  Private/Admin
router.post('/products', protect, admin, async (req, res) => {
  try {
    const { name, description, price, stock, specifications, imageUrl, category } = req.body;
    
    // Ensure images is an array and has at least one image
    if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      imageUrl,
      category,
      specifications: specifications || {}
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/products/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl, category, specifications } = req.body;
    
    const product = await Product.findById(req.params.id);

    if (product) {
      // Ensure images is an array and has at least one image when provided
      if (imageUrl !== undefined) {
        if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
          return res.status(400).json({ message: 'At least one image is required' });
        }
        product.imageUrl = imageUrl;
      }
      
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      product.category = category || product.category;
      product.specifications = specifications || product.specifications || {};

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'ProductModel not found' });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/products/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products with pagination and search
// @access  Private/Admin
router.get('/products', protect, admin, async (req, res) => {
  try {
    const pageSize = 9;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword
        ? { name: { $regex: req.query.keyword, $options: 'i' } }
        : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// @route   GET /api/admin/products
// @desc    Get all products with pagination and search
// @access  Private/Admin
router.get('/products/:id', protect, admin, async (req, res) => {
  try {
    const pageSize = 9;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword
        ? { name: { $regex: req.query.keyword, $options: 'i' } }
        : {};

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'ProductModel not found' });
    }

    /*const count = await Product.countDocuments({ ...keyword });
    const products = await Product.findById({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });*/
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
module.exports = router;
