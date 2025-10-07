const express = require('express');
const router = express.Router();
const { getProducts, createProduct, getProductById } = require('../controllers/productController');

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById);

module.exports = router;
