const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a category title'],
    trim: true,
    unique: true
  },
  count: {
    type: String,
    required: [true, 'Please add a count (e.g. 500+)']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  link: {
    type: String,
    required: [true, 'Please add a link']
  },
  iconKey: {
    type: String,
    required: [true, 'Please add an icon key (e.g. FiHome)']
  },
  gradient: {
    type: String,
    required: [true, 'Please add a gradient (e.g. from-blue-500 to-cyan-500)']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', CategorySchema);
