const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Updated to use Admin model

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vac_ncc';

const seedAdmins = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const admins = [
      {
        role: 'lead_admin',
        username: 'Raza Alam',
        password: await bcrypt.hash('raza321', 10)
      },
      {
        role: 'cto_maam',
        username: 'Deepshikha Bhattacharjee',
        password: await bcrypt.hash('cto@62ab', 10)
      },
      {
        role: 'cto_sir',
        username: 'Sangharsh Mishra',
        password: await bcrypt.hash('cto@3ab', 10)
      }
    ];

    // Clear existing admins to avoid duplication
    await Admin.deleteMany({ role: { $in: ['lead_admin', 'cto_sir', 'cto_maam'] } });
    
    await Admin.insertMany(admins);
    console.log('Admin accounts seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
