const express = require('express');
const multer = require('multer');
const systemController = require('../controllers/systemController');

const router = express.Router();
// Use multer to handle multipart/form-data for file uploads
const upload = multer({ dest: 'uploads/' });

// GET system settings (including document URLs)
router.get('/settings', systemController.getSettings);

// POST upload document to Cloudflare R2
router.post('/upload-document', upload.single('pdf'), systemController.uploadDocument);

module.exports = router;
