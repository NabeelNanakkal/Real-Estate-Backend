const express = require('express');
const router = express.Router();
const { getPartners, addPartner, deletePartner } = require('../controllers/partnerController');

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getPartners)
  .post(protect, authorize('admin', 'agent'), addPartner);

router.route('/:id')
  .delete(protect, authorize('admin', 'agent'), deletePartner);

module.exports = router;
