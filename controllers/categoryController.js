const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const category = new Category({
        name,
        slug,
        description
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
});

exports.getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .sort({ name: 1 });
    
    res.json(categories);
});

exports.getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

exports.updateCategory = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        category.description = description || category.description;
        
        if (typeof isActive !== 'undefined') {
            category.isActive = isActive;
        }
        
        // Update slug if name changed
        if (name && name !== category.name) {
            category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        }

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (category) {
        // Check if any products are using this category
        const Product = require('./productController');
        const productsCount = await Product.countDocuments({ category: category._id });
        
        if (productsCount > 0) {
            res.status(400);
            throw new Error('Cannot delete category with associated products');
        }
        
        await category.remove();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});
