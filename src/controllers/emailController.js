const nodemailer = require('nodemailer');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

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

  const now = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  // Fetch admin logo
  const admin = await User.findOne({ role: 'admin' }).select('companyLogo company').lean();
  const logoUrl = admin?.companyLogo
    ? (admin.companyLogo.startsWith('http') ? admin.companyLogo : `${process.env.BACKEND_URL || 'http://localhost:5000'}${admin.companyLogo}`)
    : null;
  const companyName = admin?.company || 'GQ Real Estate';

  const logoHtml = logoUrl
    ? `<div style="width:52px;height:52px;background:#0f1b2d;border-radius:14px;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box;"><img src="${logoUrl}" alt="${companyName}" style="width:100%;height:100%;object-fit:contain;display:block;" /></div>`
    : `<div style="width:52px;height:52px;background:linear-gradient(135deg,#e1ad42,#c9941e);border-radius:14px;line-height:52px;text-align:center;"><span style="color:#fff;font-size:22px;font-weight:900;">GQ</span></div>`;

  // ── Company notification email ──
  const companyMail = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    replyTo: email,
    subject: `New Inquiry: ${subject}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(225,173,66,0.15);border:1px solid rgba(225,173,66,0.3);border-radius:8px;padding:4px 12px;margin-bottom:16px;">
                    <span style="color:#e1ad42;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">New Website Inquiry</span>
                  </div>
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">You have a new message</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">${now}</p>
                </td>
                <td align="right" valign="top">
                  ${logoHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sender Info Cards -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding-right:8px;">
                  <div style="background:#f8f9fc;border-radius:12px;padding:16px;">
                    <p style="margin:0 0 4px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">From</p>
                    <p style="margin:0;color:#111;font-size:14px;font-weight:700;">${name}</p>
                  </div>
                </td>
                <td width="34%" style="padding:0 4px;">
                  <div style="background:#f8f9fc;border-radius:12px;padding:16px;">
                    <p style="margin:0 0 4px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Email</p>
                    <p style="margin:0;"><a href="mailto:${email}" style="color:#e1ad42;font-size:13px;font-weight:700;text-decoration:none;">${email}</a></p>
                  </div>
                </td>
                <td width="33%" style="padding-left:8px;">
                  <div style="background:#f8f9fc;border-radius:12px;padding:16px;">
                    <p style="margin:0 0 4px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Subject</p>
                    <p style="margin:0;color:#111;font-size:14px;font-weight:700;">${subject}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="background:#ffffff;padding:24px 40px 0;">
            <p style="margin:0 0 12px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Message</p>
            <div style="background:#fafafa;border-radius:12px;border-left:4px solid #e1ad42;padding:24px;">
              <p style="margin:0;color:#444;font-size:15px;line-height:1.8;white-space:pre-wrap;">${message}</p>
            </div>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="background:#ffffff;padding:28px 40px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#e1ad42,#c9941e);border-radius:10px;padding:0;">
                  <a href="mailto:${email}?subject=Re: ${subject}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.5px;">Reply to ${name} →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#16213e;border-radius:0 0 16px 16px;padding:24px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;">
              <strong style="color:rgba(255,255,255,0.7);">GQ Real Estate</strong> &nbsp;·&nbsp; Adliya, Manama, Bahrain<br/>
              This email was sent via your website contact form.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };

  // ── Auto-reply to sender ──
  const autoReply = {
    from: `"GQ Real Estate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `We received your inquiry — GQ Real Estate`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;">
            <div style="text-align:center;">
              <div style="display:inline-block;margin-bottom:20px;">
                ${logoHtml}
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Thank you, ${name}!</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;">We've received your inquiry and will get back to you shortly.</p>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 0;">

            <!-- What we received -->
            <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin-bottom:24px;">
              <p style="margin:0 0 16px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your Inquiry Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subject</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
                    <span style="color:#111;font-size:13px;font-weight:700;">${subject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Received</span>
                  </td>
                  <td style="padding:8px 0;text-align:right;">
                    <span style="color:#111;font-size:13px;font-weight:700;">${now}</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.8;">Our team typically responds within <strong style="color:#111;">24 business hours</strong>. If you need immediate help, feel free to call or WhatsApp us directly.</p>

            <!-- Contact info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f8f9fc;border-radius:12px;padding:18px;text-align:center;">
                    <p style="margin:0 0 6px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Phone</p>
                    <a href="tel:+97336599889" style="color:#e1ad42;font-size:16px;font-weight:800;text-decoration:none;">+973 365 99889</a>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f8f9fc;border-radius:12px;padding:18px;text-align:center;">
                    <p style="margin:0 0 6px;color:#999;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Working Hours</p>
                    <span style="color:#111;font-size:14px;font-weight:700;">8:00 AM – 5:00 PM</span>
                  </div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#16213e;border-radius:0 0 16px 16px;padding:24px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;text-align:center;">
              <strong style="color:rgba(255,255,255,0.7);">GQ Real Estate</strong> &nbsp;·&nbsp; Adliya, Manama, Bahrain<br/>
              © ${new Date().getFullYear()} GQ Real Estate. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };

  await transporter.sendMail(companyMail);
  await transporter.sendMail(autoReply);

  res.status(200).json({ success: true, message: 'Email sent successfully.' });
});
