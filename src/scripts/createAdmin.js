const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB for Admin Seeding');

        const adminCredentials = {
            name: 'Administrative Overseer',
            email: 'admin@estatehub.com',
            password: 'Nabeel123#',
            role: 'admin',
            phone: '+1 (800) ADMIN-HQ'
        };

        // Check if exists
        const existingAdmin = await User.findOne({ email: adminCredentials.email });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists. Updating credentials...');
            existingAdmin.password = adminCredentials.password;
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Admin credentials updated successfully');
        } else {
            const admin = await User.create(adminCredentials);
            console.log('✅ Admin user created successfully:', admin.email);
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
