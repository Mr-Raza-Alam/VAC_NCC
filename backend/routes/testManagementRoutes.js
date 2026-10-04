const express = require('express');
const multer = require('multer');
const testManagementController = require('../controllers/testManagementController');

const router = express.Router();
// Multer setup for temporary storage of uploaded CSVs
const upload = multer({ dest: 'uploads/' }); 

router.post('/settings', testManagementController.saveSettings);
router.get('/settings', testManagementController.getAllSettings);
router.get('/settings/:testType', testManagementController.getSettings);
router.post('/verify-phase', testManagementController.verifyAndFinalizePhase);
router.get('/master-results', testManagementController.getMasterResults);
router.get('/transparency-report/:testType', testManagementController.getTransparencyReport);
router.post('/upload-questions', upload.single('csvFile'), testManagementController.uploadQuestions);

module.exports = router;
