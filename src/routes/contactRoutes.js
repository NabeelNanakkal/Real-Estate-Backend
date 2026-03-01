const express = require('express');
const router = express.Router();
const { getContactContent, updateContactContent } = require('../controllers/contactController');

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getContactContent)
  .put(protect, authorize('admin', 'agent'), updateContactContent);

module.exports = router;
