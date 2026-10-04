const express = require('express');
const multer = require('multer');
const recordController = require('../controllers/recordController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-vac-students', upload.single('csvFile'), recordController.uploadVacStudents);
router.get('/vac-students', recordController.getVacStudents);
router.put('/vac-students/:rollNo', recordController.updateVacStudent);
router.delete('/vac-students/:rollNo', recordController.deleteVacStudent);

module.exports = router;
