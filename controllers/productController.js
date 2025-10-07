const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const pageSize = 8;
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
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    imageUrl,
    stock
  } = req.body;

  try {
    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
