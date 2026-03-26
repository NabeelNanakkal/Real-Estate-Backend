const express = require('express');
const router = express.Router();
const { getPartners, addPartner, deletePartner, togglePartnerStatus } = require('../controllers/partnerController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getPartners)
  .post(protect, authorize('admin', 'agent'), upload.any(), upload.normalize, addPartner);

router.route('/:id')
  .delete(protect, authorize('admin', 'agent'), deletePartner);

router.route('/:id/toggle')
  .put(protect, authorize('admin', 'agent'), togglePartnerStatus);

module.exports = router;
