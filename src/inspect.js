const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Property = require('./models/Property');

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const properties = await Property.find().limit(1);
    console.log('--- PROPERTY DATA INSPECTION ---');
    console.log(JSON.stringify(properties[0], null, 2));
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkData();
