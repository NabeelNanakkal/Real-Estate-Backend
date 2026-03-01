module.exports = {
  // MongoDB
  MONGO_DUPLICATE_KEY: 11000,

  // Pagination
  DEFAULT_PAGE_LIMIT: 10,

  // Property
  LISTING_ID_PREFIX: 'EH',

  // CRM
  CRM_ERROR_MSG: 'Zoho API error or missing tokens',

  // Zoho (loaded from env at runtime)
  get ZOHO_WEBHOOK_TOKEN() { return process.env.ZOHO_WEBHOOK_TOKEN || 'realestate_bigin_webhook'; },
  get ZOHO_CHANNEL_ID()    { return process.env.ZOHO_CHANNEL_ID    || '1000000068001'; },
};
