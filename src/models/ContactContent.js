const mongoose = require('mongoose');

const ContactContentSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add an email address']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  mapUrl: {
    type: String,
    required: [true, 'Please add a Google Maps embed URL']
  },
  workingHours: {
    type: String,
    required: [true, 'Please add working hours']
  },
  faqs: [
    {
      question: {
        type: String,
        required: [true, 'Please add a question']
      },
      answer: {
        type: String,
        required: [true, 'Please add an answer']
      }
    }
  ],
  socialLinks: {
    facebook: { type: String, default: '#' },
    twitter: { type: String, default: '#' },
    instagram: { type: String, default: '#' },
    linkedin: { type: String, default: '#' }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContactContent', ContactContentSchema);
