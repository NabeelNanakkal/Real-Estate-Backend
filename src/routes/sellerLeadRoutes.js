const express = require('express');
const router  = express.Router();
const { createSellerLead, getSellerLeads, updateSellerLead, deleteSellerLead } = require('../controllers/sellerLeadController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(createSellerLead)
  .get(protect, authorize('admin', 'agent'), getSellerLeads);

router.route('/:id')
  .put(protect, authorize('admin', 'agent'), updateSellerLead)
  .delete(protect, authorize('admin', 'agent'), deleteSellerLead);

module.exports = router;
