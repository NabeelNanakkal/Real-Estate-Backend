const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Please add a client name'],
    trim:      true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  role: {
    type:      String,
    required:  [true, 'Please add a role / title'],
    trim:      true,
    maxlength: [100, 'Role cannot exceed 100 characters'],
  },
  content: {
    type:      String,
    required:  [true, 'Please add testimonial content'],
    trim:      true,
    maxlength: [300, 'Content cannot exceed 300 characters'],
  },
  image: {
    type:    String,
    default: '',
  },
  rating: {
    type:    Number,
    min:     1,
    max:     5,
    default: 5,
  },
  isActive: {
    type:    Boolean,
    default: true,
  },
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);
