const mongoose = require('mongoose');

// Inline schema — no separate model file needed
const tokenSchema = new mongoose.Schema({
  key:           { type: String, default: 'zoho', unique: true },
  access_token:  String,
  refresh_token: String,
  expires_in:    Number,
  timestamp:     Number,
  api_domain:    String,
});

const Token = mongoose.models.ZohoToken || mongoose.model('ZohoToken', tokenSchema);

exports.saveTokens = async (tokens) => {
  await Token.findOneAndUpdate(
    { key: 'zoho' },
    { ...tokens, key: 'zoho' },
    { upsert: true, new: true }
  );
};

exports.getTokens = async () => {
  try {
    const doc = await Token.findOne({ key: 'zoho' }).lean();
    if (!doc) return null;
    const { _id, __v, key, ...tokens } = doc;
    return tokens;
  } catch (error) {
    console.error('Error reading Zoho tokens:', error);
    return null;
  }
};
