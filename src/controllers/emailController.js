const asyncHandler = require('../utils/asyncHandler');
const { pushInquiryToBigin } = require('./zohoController');

// @desc    Send contact form — push to Zoho Bigin CRM
// @route   POST /api/contact/send
// @access  Public
exports.sendContactEmail = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Fire-and-forget push to Bigin
  setImmediate(async () => {
    try {
      await pushInquiryToBigin({
        name,
        email,
        phone: phone || '',
        message: `Subject: ${subject}\n\n${message}`,
        propertyTitle: 'Contact Form Inquiry',
      });
    } catch (err) {
      console.error('Contact form Bigin sync failed:', err.message);
    }
  });

  res.status(200).json({ success: true, message: 'Your inquiry has been submitted successfully.' });
});
