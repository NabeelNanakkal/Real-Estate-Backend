const express = require('express');
const router = express.Router();
const { getPartners, addPartner, deletePartner } = require('../controllers/partnerController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getPartners)
  .post(protect, authorize('admin', 'agent'), upload.any(), addPartner);

router.route('/:id')
  .delete(protect, authorize('admin', 'agent'), deletePartner);

module.exports = router;
