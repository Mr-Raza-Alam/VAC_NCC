const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/admin/login', authController.adminLogin);
router.get('/admins', authController.getAdmins);
router.put('/admins/:id/permissions', authController.updatePermissions);

router.post('/student/register', authController.studentRegister);
router.post('/student/login', authController.studentLogin);

module.exports = router;
