const nodemailer = require('nodemailer');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Send contact form email
// @route   POST /api/contact/send
// @access  Public
exports.sendContactEmail = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email sent to the company
  const companyMail = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    replyTo: email,
    subject: `[Website Inquiry] ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#e1ad42,#c9941e);padding:28px 32px;border-radius:12px 12px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">New Inquiry — GQ Real Estate</h2>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #f0f0f0;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:100px;">From</td><td style="padding:10px 0;font-weight:700;color:#111;">${name}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Email</td><td style="padding:10px 0;color:#e1ad42;">${email}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subject</td><td style="padding:10px 0;font-weight:700;color:#111;">${subject}</td></tr>
          </table>
          <div style="margin-top:24px;padding:20px;background:#f9f9f9;border-radius:10px;border-left:4px solid #e1ad42;">
            <p style="margin:0;color:#444;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin-top:24px;font-size:11px;color:#bbb;">Sent via GQ Real Estate contact form</p>
        </div>
      </div>
    `,
  };

  // Auto-reply to the sender
  const autoReply = {
    from: `"GQ Real Estate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'We received your inquiry — GQ Real Estate',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#e1ad42,#c9941e);padding:28px 32px;border-radius:12px 12px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:22px;font-weight:900;">Thank you, ${name}!</h2>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #f0f0f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="color:#444;line-height:1.7;font-size:15px;">We have received your inquiry regarding <strong>${subject}</strong> and our team will get back to you shortly.</p>
          <p style="color:#444;line-height:1.7;font-size:15px;">If you need immediate assistance, you can reach us at <a href="tel:+97336599889" style="color:#e1ad42;font-weight:700;">+973 365 99889</a>.</p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />
          <p style="font-size:13px;color:#888;">GQ Real Estate &mdash; Adliya, Manama, Bahrain<br/>Working Hours: 8:00 AM – 5:00 PM</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(companyMail);
  await transporter.sendMail(autoReply);

  res.status(200).json({ success: true, message: 'Email sent successfully.' });
});
