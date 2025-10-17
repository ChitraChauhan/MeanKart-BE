const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    createProduct, 
    getProductById, 
    updateProduct, 
    deleteProduct,
    getProductCategories 
} = require('../controllers/productController');

router.route('/')
    .get(getProducts)
    .post(createProduct);

router.route('/categories')
    .get(getProductCategories);

router.route('/:id')
    .get(getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
