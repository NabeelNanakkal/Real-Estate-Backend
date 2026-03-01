const Inquiry = require('../models/Inquiry');
const { pushInquiryToBigin, deleteContactFromBigin } = require('./zohoController');
const asyncHandler = require('../utils/asyncHandler');
const { CRM_ERROR_MSG } = require('../constants');

// ─── Helper ──────────────────────────────────────────────────────────────────

const syncToBigin = async (inquiry, propertyTitle) => {
  const syncResult = await pushInquiryToBigin({
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    message: inquiry.message,
    propertyTitle: propertyTitle || 'Unknown Property'
  });

  if (syncResult?.data) {
    await Inquiry.findByIdAndUpdate(inquiry._id, {
      crmSyncStatus: 'success',
      crmContactId: syncResult.contactId || null,
      crmError: null
    });
    return true;
  }

  await Inquiry.findByIdAndUpdate(inquiry._id, { crmSyncStatus: 'failed', crmError: CRM_ERROR_MSG });
  return false;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc    Create inquiry
// @route   POST /api/inquiries
// @access  Public
exports.createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.create(req.body);

  // Fire-and-forget background sync
  setImmediate(async () => {
    try {
      const populated = await Inquiry.findById(inquiry._id).populate('property', 'title');
      await syncToBigin(inquiry, populated?.property?.title);
    } catch (err) {
      console.error('Background CRM sync failed:', err.message);
      await Inquiry.findByIdAndUpdate(inquiry._id, { crmSyncStatus: 'failed', crmError: err.message });
    }
  });

  res.status(201).json({ success: true, data: inquiry });
});

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private (Admin/Agent)
exports.getInquiries = asyncHandler(async (_req, res) => {
  const inquiries = await Inquiry.find()
    .populate('property', 'title location.address')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: inquiries.length, data: inquiries });
});

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private (Admin/Agent)
exports.updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!inquiry) {
    return res.status(404).json({ success: false, message: 'Inquiry not found' });
  }

  res.json({ success: true, data: inquiry });
});

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin/Agent)
exports.deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ success: false, message: 'Inquiry not found' });
  }

  if (inquiry.crmContactId) {
    await deleteContactFromBigin(inquiry.crmContactId);
  }

  await inquiry.deleteOne();
  res.json({ success: true, data: {} });
});

// @desc    Retry Bigin CRM Sync
// @route   POST /api/inquiries/:id/sync
// @access  Private (Admin/Agent)
exports.retrySyncInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate('property', 'title');

  if (!inquiry) {
    return res.status(404).json({ success: false, message: 'Inquiry not found' });
  }

  inquiry.crmSyncStatus = 'pending';
  inquiry.crmError = null;
  await inquiry.save();

  await syncToBigin(inquiry, inquiry.property?.title);

  const updated = await Inquiry.findById(inquiry._id).populate('property', 'title');
  res.json({ success: true, data: updated });
});
