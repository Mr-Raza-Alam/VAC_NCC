const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.getSettings);
router.put('/broadcast', settingsController.updateBroadcast);
router.post('/reset', settingsController.executeReset);
router.get('/audit-logs', settingsController.getAuditLogs);

module.exports = router;
