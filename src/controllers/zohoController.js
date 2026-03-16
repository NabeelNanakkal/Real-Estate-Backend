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
  let tokens = await tokenManager.getTokens();
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
      await tokenManager.saveTokens(tokens);
    } else {
      throw new Error(`Token refresh failed: ${JSON.stringify(response.data)}`);
    }
  }

  return tokens;
};

// ─── Route handlers ──────────────────────────────────────────────────────────

// @desc    Get Bigin Clients module field API names (for debugging)
// @route   GET /api/auth/zoho/fields
// @access  Private (Admin only)
exports.getFields = asyncHandler(async (req, res) => {
  const tokens    = await ensureValidToken();
  const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
  const response  = await axios.get(`${apiDomain}/bigin/v1/settings/fields?module=Contacts`, {
    headers: biginHeaders(tokens.access_token),
  });
  const fields = response.data?.fields?.map(f => ({ label: f.field_label, api_name: f.api_name, type: f.data_type }));
  res.json({ success: true, fields });
});

// @desc    Check Zoho connection status
// @route   GET /api/auth/zoho/status
// @access  Private (Admin only)
exports.getStatus = asyncHandler(async (req, res) => {
  const tokens = await tokenManager.getTokens();
  if (!tokens) {
    return res.json({ connected: false, message: 'No tokens found. Visit /api/auth/zoho/init to authorize.' });
  }
  const ageMs      = Date.now() - tokens.timestamp;
  const expiresMs  = (tokens.expires_in - 60) * 1000;
  const isExpired  = ageMs > expiresMs;
  res.json({
    connected:     true,
    api_domain:    tokens.api_domain,
    token_expired: isExpired,
    expires_in_s:  Math.max(0, Math.round((expiresMs - ageMs) / 1000)),
    has_refresh:   !!tokens.refresh_token,
  });
});

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
      await tokenManager.saveTokens({
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
    const contactFields = {
      ...splitName(inquiryData.name),
      Email:       inquiryData.email,
      Phone:       inquiryData.phone,
      Description: inquiryData.message,
      Lead_Source: inquiryData.source || 'Enquiry',
    };

    if (inquiryData.propertyTitle) contactFields.Property      = inquiryData.propertyTitle;
    if (inquiryData.propertyCode)  contactFields.Property_Code  = inquiryData.propertyCode;
    if (inquiryData.propertyType)  contactFields.Property_Type  = inquiryData.propertyType;

    const contactData = { data: [contactFields] };

    const response  = await axios.post(`${apiDomain}/bigin/v1/Contacts`, contactData, { headers: biginHeaders(tokens.access_token) });
    const record    = response.data?.data?.[0];
    if (record?.status === 'error') {
      const errMsg = record.message || JSON.stringify(record);
      console.error('Bigin record error:', record);
      return { error: errMsg };
    }
    const contactId = record?.details?.id || null;
    return { ...response.data, contactId };
  } catch (error) {
    const errorMsg = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    console.error('Bigin Sync Error:', errorMsg);
    return { error: errorMsg };
  }
};

// ─── Property → Bigin Products sync ──────────────────────────────────────────

const buildProductPayload = (property) => {
  const agentName = property.agent?.name || '';

  const commissionDisplay = property.commissionValue
    ? property.commissionType === 'percentage'
      ? `${property.commissionValue}%`
      : `${property.commissionValue} (Fixed)`
    : '';

  const categoryName = property.category?.name || '';

  return {
    Product_Name:        property.title,
    Product_Code:        property.listingId,
    Unit_Price:          property.price,
    Product_Active:      property.status === 'active',
    Description:         property.description || '',
    Product_Status:      property.status || '',
    Owner_Name:          property.ownerName || '',
    Agent:               agentName,
    VAT_Number:          property.vatNumber || '',
    Agreed_Commission:   commissionDisplay,
    Location:            property.location || '',
    Area:                property.area || '',
    Property_Category:   categoryName,
    Property_Type:       property.propertyType || '',
    EWA_Type:            property.ewaType || '',
  };
};

// @desc    Push property to Bigin Products
exports.pushPropertyToBigin = async (property) => {
  try {
    const tokens    = await ensureValidToken();
    const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
    const response  = await axios.post(
      `${apiDomain}/bigin/v1/Products`,
      { data: [buildProductPayload(property)] },
      { headers: biginHeaders(tokens.access_token) }
    );
    const record = response.data?.data?.[0];
    if (record?.status === 'error') {
      console.error('Bigin Products create error:', record);
      return { error: record.message };
    }
    return { productId: record?.details?.id || null };
  } catch (error) {
    console.error('Bigin Products Push Error:', error.response?.data || error.message);
    return { error: error.message };
  }
};

// @desc    Update property in Bigin Products
exports.updatePropertyInBigin = async (crmProductId, property) => {
  try {
    const tokens    = await ensureValidToken();
    const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
    const response  = await axios.put(
      `${apiDomain}/bigin/v1/Products/${crmProductId}`,
      { data: [{ id: crmProductId, ...buildProductPayload(property) }] },
      { headers: biginHeaders(tokens.access_token) }
    );
    const record = response.data?.data?.[0];
    if (record?.status === 'error') {
      console.error('Bigin Products update error:', record);
      return { error: record.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Bigin Products Update Error:', error.response?.data || error.message);
    return { error: error.message };
  }
};

// @desc    Delete property from Bigin Products
exports.deletePropertyFromBigin = async (crmProductId) => {
  try {
    const tokens    = await ensureValidToken();
    const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';
    await axios.delete(`${apiDomain}/bigin/v1/Products/${crmProductId}`, { headers: biginHeaders(tokens.access_token) });
    return true;
  } catch (error) {
    console.error('Bigin Products Delete Error:', error.response?.data || error.message);
    return false;
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

// @desc    Push seller lead to Bigin Contacts
exports.pushSellerLeadToBigin = async (lead) => {
  try {
    const tokens    = await ensureValidToken();
    const apiDomain = tokens.api_domain || 'https://www.zohoapis.com';

    const contactFields = {
      ...splitName(lead.name),
      Email:         lead.email,
      Phone:         lead.phone,
      Lead_Source:   'Sell My Property',
      Property_Type: lead.propertyType || '',
      Description: [
        `Location: ${lead.location}`,
        lead.propertyType ? `Property Type: ${lead.propertyType}` : '',
        lead.sqm ? `Area: ${lead.sqm} sqm` : '',
        lead.message ? `Note: ${lead.message}` : '',
      ].filter(Boolean).join('\n'),
    };

    const response = await axios.post(
      `${apiDomain}/bigin/v1/Contacts`,
      { data: [contactFields] },
      { headers: biginHeaders(tokens.access_token) }
    );

    const record = response.data?.data?.[0];
    if (record?.status === 'error') {
      console.error('Bigin seller lead error:', record);
      return { error: record.message };
    }
    return { contactId: record?.details?.id || null, ...response.data };
  } catch (error) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error('Bigin Seller Lead Sync Error:', msg);
    return { error: msg };
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
