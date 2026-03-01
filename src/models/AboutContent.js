const mongoose = require('mongoose');

const AboutContentSchema = new mongoose.Schema({
  hero: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    image: { type: String }
  },
  mission: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    points: [String]
  },
  stats: [{
    label: String,
    value: Number,
    suffix: String
  }],
  values: [{
    title: String,
    description: String,
    iconKey: String // react-icons key
  }],
  team: [{
    name: String,
    role: String,
    image: String
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AboutContent', AboutContentSchema);
