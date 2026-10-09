const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware'); // Admin/Student checks if needed

// Admin routes
router.get('/', classController.getClasses); // Everyone can get classes
router.post('/', authMiddleware, classController.createClass);
router.put('/:id/toggle-attendance', authMiddleware, classController.toggleAttendance);
router.post('/auto-ca', authMiddleware, classController.autoCalculateCAMarks);

// Student routes
router.post('/:id/mark-attendance', authMiddleware, classController.markAttendance);

module.exports = router;
