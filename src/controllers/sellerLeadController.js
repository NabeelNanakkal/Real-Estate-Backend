const SellerLead = require('../models/SellerLead');
const { pushSellerLeadToBigin } = require('./zohoController');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit a seller lead
// @route   POST /api/seller-leads
// @access  Public
exports.createSellerLead = asyncHandler(async (req, res) => {
  const { name, email, phone, location, sqm, propertyType, message } = req.body;

  if (!name || !email || !phone || !location) {
    return res.status(400).json({ success: false, message: 'Name, email, phone and location are required.' });
  }

  const lead = await SellerLead.create({ name, email, phone, location, sqm, propertyType, message });

  res.status(201).json({ success: true, message: 'Your request has been submitted. We will contact you shortly.' });

  // Fire-and-forget Zoho sync
  setImmediate(async () => {
    try {
      const result = await pushSellerLeadToBigin({ name, email, phone, location, sqm, propertyType, message });
      if (result?.contactId) {
        await SellerLead.findByIdAndUpdate(lead._id, { crmSyncStatus: 'success', crmContactId: result.contactId });
      } else {
        await SellerLead.findByIdAndUpdate(lead._id, { crmSyncStatus: 'failed', crmError: result?.error || 'Unknown error' });
      }
    } catch (err) {
      console.error('Seller lead CRM sync failed:', err.message);
    }
  });
});

// @desc    Get all seller leads (admin)
// @route   GET /api/seller-leads
// @access  Private/Admin
exports.getSellerLeads = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 15 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name:     { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { phone:    { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, newCount, leads] = await Promise.all([
    SellerLead.countDocuments(query),
    SellerLead.countDocuments({ ...query, status: 'new' }),
    SellerLead.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
  ]);
  res.json({
    success: true,
    data: leads,
    pagination: {
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      newCount,
      contactedCount: total - newCount,
    },
  });
});

// @desc    Update seller lead status
// @route   PUT /api/seller-leads/:id
// @access  Private/Admin
exports.updateSellerLead = asyncHandler(async (req, res) => {
  const lead = await SellerLead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  res.json({ success: true, data: lead });
});

// @desc    Delete seller lead
// @route   DELETE /api/seller-leads/:id
// @access  Private/Admin
exports.deleteSellerLead = asyncHandler(async (req, res) => {
  const lead = await SellerLead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  res.json({ success: true, message: 'Lead deleted.' });
});
