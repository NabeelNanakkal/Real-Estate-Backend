const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AboutContent = require('./models/AboutContent');

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate');
    const content = await AboutContent.findOne();
    console.log('--- ABOUT CONTENT DATA INSPECTION ---');
    console.log(JSON.stringify(content, null, 2));
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkData();
