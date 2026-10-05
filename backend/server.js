require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI && process.env.VERCEL) {
    console.error("CRITICAL ERROR: MONGO_URI environment variable is not set in Vercel!");
}

const connectDB = async () => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/vac_ncc';
    await mongoose.connect(dbUri, {
        serverSelectionTimeoutMS: 5000, // Fail early if no connection
    });
    console.log('Connected to MongoDB');
};

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
    // Explicit diagnostic for missing env var
    if (!MONGO_URI && process.env.VERCEL) {
        return res.status(500).json({ 
            message: "CRITICAL FIX NEEDED: MONGO_URI environment variable is missing. You must add your MongoDB connection string to Vercel Dashboard -> Settings -> Environment Variables." 
        });
    }

    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: "Failed to establish database connection. Connection state: " + mongoose.connection.readyState });
        }
        next();
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return res.status(500).json({ 
            message: "MongoDB Connection Error. Ensure your Atlas IP is whitelisted (0.0.0.0/0) and the URI is correct.",
            error: err.message
        });
    }
});

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
