const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(categoryController.getCategories)
  .post(protect, admin, categoryController.createCategory);

router
  .route('/:id')
  .get(categoryController.getCategoryById)
  .put(protect, admin, categoryController.updateCategory)
  .delete(protect, admin, categoryController.deleteCategory);

module.exports = router;
