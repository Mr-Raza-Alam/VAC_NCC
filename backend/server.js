require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vac_ncc';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testManagementRoutes = require('./routes/testManagementRoutes');
const recordRoutes = require('./routes/recordRoutes');
const systemRoutes = require('./routes/systemRoutes');
const studentRoutes = require('./routes/studentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Basic route to test server
app.get('/', (req, res) => {
  res.send('VAC_NCC Backend API is running');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test-management', testManagementRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/settings', settingsRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
