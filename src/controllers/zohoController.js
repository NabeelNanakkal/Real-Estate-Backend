const axios = require('axios');
const tokenManager = require('../utils/zohoTokenManager');
const asyncHandler = require('../utils/asyncHandler');
const { ZOHO_CHANNEL_ID, ZOHO_WEBHOOK_TOKEN } = require('../constants');

// ─── Region map ───────────────────────────────────────────────────────────────

const REGION_AUTH_URLS = {
  in:     'https://accounts.zoho.in/oauth/v2/auth',
  eu:     'https://accounts.zoho.eu/oauth/v2/auth',
  'com.au': 'https://accounts.zoho.com.au/oauth/v2/auth',
  com:    'https://accounts.zoho.com/oauth/v2/auth',
};

const DEFAULT_AUTH_URL  = REGION_AUTH_URLS.com;
const DEFAULT_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const REDIRECT_URI      = () => process.env.ZOHO_REDIRECT_URI || 'http://localhost:5000/api/auth/zoho/callback';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/);
  return {
    Last_Name:  parts.pop() || fullName,
    First_Name: parts.join(' '),
  };
};

const biginHeaders = (accessToken) => ({
  Authorization: `Zoho-oauthtoken ${accessToken}`,
  'Content-Type': 'application/json',
});

// ─── Token management ────────────────────────────────────────────────────────

const ensureValidToken = async () => {
  let tokens = tokenManager.getTokens();
  if (!tokens) throw new Error('Zoho not authorized');

  const isExpired = Date.now() - tokens.timestamp > (tokens.expires_in - 60) * 1000;

  if (isExpired && tokens.refresh_token) {
    const accountsServer = tokens.api_domain
      ? tokens.api_domain.replace('www.zohoapis', 'accounts.zoho')
      : 'https://accounts.zoho.com';

    const response = await axios.post(`${accountsServer}/oauth/v2/token`, null, {
      params: {
        grant_type:    'refresh_token',
        client_id:     process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
      },
    });

    if (response.data.access_token) {
      tokens = { ...tokens, access_token: response.data.access_token, expires_in: response.data.expires_in, timestamp: Date.now() };
      tokenManager.saveTokens(tokens);
    }
  }

  return tokens;
};

// ─── Route handlers ──────────────────────────────────────────────────────────

// @desc    Initiate Zoho OAuth flow
// @route   GET /api/auth/zoho/init
// @access  Private (Admin only)
exports.initiateOAuth = (req, res) => {
  const client_id = process.env.ZOHO_CLIENT_ID;
  if (!client_id) {
    return res.status(500).json({ success: false, message: 'ZOHO_CLIENT_ID missing in .env' });
  }

  const baseUrl = REGION_AUTH_URLS[req.query.region] || DEFAULT_AUTH_URL;
  const scope   = 'ZohoBigin.modules.all,ZohoBigin.settings.all';
  const url     = `${baseUrl}?scope=${scope}&client_id=${client_id}&response_type=code&access_type=offline&redirect_uri=${REDIRECT_URI()}&prompt=consent`;

  res.redirect(url);
};

// @desc    Handle Zoho OAuth callback
// @route   GET /api/auth/zoho/callback
// @access  Public (Called by Zoho)
exports.handleCallback = async (req, res) => {
  const { code, error, 'accounts-server': accountsServer } = req.query;

  if (error) return res.status(400).json({ success: false, message: `Zoho Auth Error: ${error}` });
  if (!code)  return res.status(400).json({ success: false, message: 'No authorization code provided' });

  try {
    const tokenUrl = accountsServer ? `${accountsServer}/oauth/v2/token` : DEFAULT_TOKEN_URL;

    const response = await axios.post(tokenUrl, null, {
      params: {
        grant_type:    'authorization_code',
        client_id:     process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI(),
        code,
      },
    });

    if (response.data.access_token) {
      tokenManager.saveTokens({
        access_token:  response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in:    response.data.expires_in,
        timestamp:     Date.now(),
        api_domain:    response.data.api_domain || (accountsServer
          ? accountsServer.replace('accounts', 'www')
          : 'https://www.zohoapis.com'),
      });
      res.send('✅ Zoho CRM Connected Successfully! You can close this window.');
    } else {
      res.status(400).json({ success: false, data: response.data });
    }
  } catch (err) {
    console.error('Zoho Token Exchange Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to exchange code for tokens' });
  }
};

// @desc    Push inquiry to Bigin Contacts
exports.pushInquiryToBigin = async (inquiryData) => {
  try {
    const tokens      = await ensureValidToken();
    const apiDomain   = tokens.api_domain || 'https://www.zohoapis.com';
    const contactData = {
      data: [{
        ...splitName(inquiryData.name),
        Email:       inquiryData.email,
        Phone:       inquiryData.phone,
        Description: `Inquiry for property: ${inquiryData.propertyTitle}\nMessage: ${inquiryData.message}`,
      }],
    };

    const response  = await axios.post(`${apiDomain}/bigin/v1/Contacts`, contactData, { headers: biginHeaders(tokens.access_token) });
    const contactId = response.data?.data?.[0]?.details?.id || null;
    return { ...response.data, contactId };
  } catch (error) {
    console.error('Bigin Sync Error:', error.response?.data || error.message);
    return null;
  }
};

// @desc    Delete contact from Bigin
exports.deleteContactFromBigin = async (contactId) => {
  try {
    const tokens    = await ensureValidToken();
    const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
    await axios.delete(`${apiDomain}/bigin/v1/Contacts/${contactId}`, { headers: biginHeaders(tokens.access_token) });
    return true;
  } catch (error) {
    console.error('Bigin Delete Error:', error.response?.data || error.message);
    return false;
  }
};

// @desc    Receive Zoho Bigin notification (contact deleted → delete inquiry)
// @route   POST /api/auth/zoho/webhook
// @access  Public (called by Zoho)
exports.handleWebhook = asyncHandler(async (req, res) => {
  const Inquiry = require('../models/Inquiry');
  const { operation, module: mod, ids = [] } = req.body;

  if (operation === 'delete' && mod === 'Contacts' && ids.length > 0) {
    await Inquiry.deleteMany({ crmContactId: { $in: ids } });
  }

  res.json({ success: true });
});

// @desc    Subscribe to Zoho Bigin contact delete notifications
// @route   POST /api/auth/zoho/subscribe
// @access  Private (Admin only)
exports.subscribeNotifications = asyncHandler(async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ success: false, message: 'webhookUrl is required' });
  }

  const tokens    = await ensureValidToken();
  const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
  const expiry    = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const response = await axios.post(
    `${apiDomain}/bigin/v1/actions/watch`,
    {
      watch: [{
        channel_id:     ZOHO_CHANNEL_ID,
        events:         ['Contacts.delete'],
        channel_expiry: expiry,
        token:          ZOHO_WEBHOOK_TOKEN,
        notify_url:     webhookUrl,
      }],
    },
    { headers: biginHeaders(tokens.access_token) }
  );

  res.json({ success: true, data: response.data });
});
