const mongoose = require('mongoose');

const sellerLeadSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, lowercase: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  sqm:          { type: Number },
  propertyType: { type: String, trim: true },
  message:      { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
  },
  crmSyncStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  crmContactId: { type: String },
  crmError:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SellerLead', sellerLeadSchema);
