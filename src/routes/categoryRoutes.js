const express = require('express');
const router = express.Router();
const { getCategories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus } = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin', 'agent'), addCategory);

router.route('/:id')
  .put(protect, authorize('admin', 'agent'), updateCategory)
  .delete(protect, authorize('admin', 'agent'), deleteCategory);

router.put('/:id/toggle', protect, authorize('admin', 'agent'), toggleCategoryStatus);

module.exports = router;
