const express = require('express');
const router  = express.Router();
const { getPropertyTypes, addPropertyType, updatePropertyType, togglePropertyType, deletePropertyType } = require('../controllers/propertyTypeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getPropertyTypes)
  .post(protect, authorize('admin', 'agent'), addPropertyType);

router.route('/:id')
  .put(protect, authorize('admin', 'agent'), updatePropertyType)
  .delete(protect, authorize('admin', 'agent'), deletePropertyType);

router.put('/:id/toggle', protect, authorize('admin', 'agent'), togglePropertyType);

module.exports = router;
