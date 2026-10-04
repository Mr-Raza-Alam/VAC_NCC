const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All student routes are protected
router.use(authMiddleware);

router.get('/me', studentController.getStudentProfile);
router.put('/onboard', studentController.onboardStudent);
router.get('/dashboard-scores', studentController.getStudentDashboardScores);
router.get('/questions/:testType', studentController.fetchQuestions);
router.post('/submit-test/:testType', studentController.submitTest);
router.get('/result-details/:testType', studentController.getTestResultDetails);

module.exports = router;
