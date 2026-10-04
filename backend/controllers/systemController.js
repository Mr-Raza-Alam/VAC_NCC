const SystemSettings = require('../models/SystemSettings');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configure the S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ identifier: 'global' });
    if (!settings) {
      settings = await SystemSettings.create({ identifier: 'global' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { type } = req.body; // 'syllabus' or 'notes'
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (type !== 'syllabus' && type !== 'notes') {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Verify Cloudflare R2 Env Variables exist
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_BUCKET_NAME) {
       // Clean up local temp file since we can't upload
       if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
       return res.status(500).json({ message: 'Cloudflare R2 is not configured on the backend yet.' });
    }

    const fileStream = fs.createReadStream(file.path);
    const fileName = `${type}_${Date.now()}.pdf`;

    // Upload to Cloudflare R2
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: 'application/pdf',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Delete temp file from local upload dir
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Update MongoDB with the public URL
    const publicBaseUrl = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxx.r2.dev
    const fileUrl = `${publicBaseUrl}/${fileName}`;

    let settings = await SystemSettings.findOne({ identifier: 'global' });
    if (!settings) {
      settings = new SystemSettings({ identifier: 'global' });
    }

    if (type === 'syllabus') {
      settings.syllabusUrl = fileUrl;
    } else {
      settings.notesUrl = fileUrl;
    }

    await settings.save();

    res.status(200).json({ message: `${type} uploaded successfully`, url: fileUrl });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
       fs.unlinkSync(req.file.path);
    }
    console.error("R2 Upload Error:", error);
    res.status(500).json({ message: 'Error uploading file to Cloudflare R2', error: error.message });
  }
};
