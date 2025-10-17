const Product = require('../models/Product');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {recursive: true});
}

exports.getProductById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({message: 'Invalid product ID'});
        }

        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({message: 'ProductModel not found'});
        }
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({message: 'Server Error'});
    }
};

exports.getProducts = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.page) || 1;
        const keyword = req.query.keyword
            ? {name: {$regex: req.query.keyword, $options: 'i'}}
            : {};

        const count = await Product.countDocuments({...keyword});
        const products = await Product.find({...keyword})
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({createdAt: -1});

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({message: 'Server Error'});
    }
};

const saveBase64Image = (base64Data, filename) => {
    try {
        const base64String = base64Data.split(';base64,').pop();
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, base64String, {encoding: 'base64'});
        return `/uploads/${filename}`; // Return the public URL
    } catch (error) {
        console.error('Error saving image:', error);
        throw error;
    }
};

exports.createProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        stock,
        specifications,
        imageUrl = []
    } = req.body;

    try {
        const imageUrls = [];
        for (const img of imageUrl) {
            if (img.base64) {
                const fileExt = img.fileType.split('/')[1] || 'jpg';
                const filename = `${img.fileName}.${fileExt}`;
                const image = saveBase64Image(img.base64, filename);
                imageUrls.push(image);
            } else if (typeof img === 'string') {
                imageUrls.push(img);
            }
        }

        const product = new Product({
            name,
            description,
            price,
            category,
            stock,
            specifications: typeof specifications === 'string'
                ? JSON.parse(specifications)
                : specifications,
            imageUrl: imageUrls
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            message: 'Error creating product',
            error: error.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        stock,
        specifications,
        imageUrl = []
    } = req.body;

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({message: 'Product not found'});
        }

        const imageUrls = [];
        for (const img of imageUrl) {
            if (img.base64) {
                const fileExt = img.fileType.split('/')[1] || 'jpg';
                const filename = `${img.fileName}.${fileExt}`;
                const image = saveBase64Image(img.base64, filename);
                imageUrls.push(image);
            } else if (typeof img === 'string' && !imageUrls.includes(img)) {
                imageUrls.push(img);
            }
        }
        console.log('imageUrls aft', imageUrls)

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;
        product.imageUrl = imageUrls;

        if (specifications) {
            product.specifications = typeof specifications === 'string'
                ? JSON.parse(specifications)
                : specifications;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            message: 'Error updating product',
            error: error.message
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({message: 'Product not found'});
        }

        if (product.imageUrl && Array.isArray(product.imageUrl)) {
            for (const imageUrl of product.imageUrl) {
                try {
                    if (imageUrl.startsWith('/uploads/')) {
                        const filename = path.basename(imageUrl);
                        const filePath = path.join(uploadsDir, filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }
                } catch (error) {
                    console.error(`Error deleting image ${imageUrl}:`, error);
                }
            }
        }

        await Product.deleteOne({_id: req.params.id});

        res.json({message: 'Product removed'});
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            message: 'Error deleting product',
            error: error.message
        });
    }
};
