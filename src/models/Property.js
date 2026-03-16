const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'villa', 'house', 'office', 'land']
  },
  listingType: {
    type: String,
    required: true,
    enum: ['sale', 'rent', 'commercial'],
    default: 'sale'
  },
  rentPeriod: {
    type: String,
    enum: ['monthly', 'yearly', ''],
    default: ''
  },
  ewaType: {
    type: String,
    enum: ['ewa-exclusive', 'ewa-inclusive', ''],
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  mapUrl: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  bedrooms: {
    type: Number
  },
  bathrooms: {
    type: Number
  },
  area: {
    type: Number,
    required: true
  },
  floor: {
    type: Number
  },
  totalFloors: {
    type: Number
  },
  plotSize: {
    type: Number
  },
  houseFloors: {
    type: Number
  },
  furnished: {
    type: Boolean,
    default: false
  },
  roadAccess: {
    type: Boolean,
    default: false
  },
  zoning: {
    type: String,
    enum: ['residential', 'commercial', 'mixed', 'agricultural', 'industrial', '']
  },
  yearBuilt: {
    type: Number,
    default: new Date().getFullYear()
  },
  listingId: {
    type: String,
    unique: true
  },
  parking: {
    type: Number,
    default: 0
  },
  amenities: [{
    name: String,
    iconKey: String
  }],
  nearby: [{
    name: String,
    distance: String,
    type: {
      type: String,
      enum: ['school', 'hospital', 'shopping', 'transport', 'park', 'other']
    }
  }],
  images: [{
    type: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'rented', 'inactive'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crmProductId: {
    type: String,
    default: null
  },
  ownerName: {
    type: String,
    default: ''
  },
  vatNumber: {
    type: String,
    default: ''
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed', ''],
    default: ''
  },
  commissionValue: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);
