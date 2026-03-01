const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry,
  retrySyncInquiry
} = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(createInquiry)
  .get(protect, authorize('admin', 'agent'), getInquiries);

router.route('/:id')
  .put(protect, authorize('admin', 'agent'), updateInquiry)
  .delete(protect, authorize('admin', 'agent'), deleteInquiry);

router.post('/:id/sync', protect, authorize('admin', 'agent'), retrySyncInquiry);

module.exports = router;
