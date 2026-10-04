const VacStudent = require('../models/VacStudent');
const InternalTestRecord = require('../models/InternalTestRecord');
const PracticalRecord = require('../models/PracticalRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const MasterRecord = require('../models/MasterRecord');
const Question = require('../models/Question');
const SystemSettings = require('../models/SystemSettings');

exports.getStudentProfile = async (req, res) => {
    try {
        const student = await VacStudent.findById(req.user.id).select('-password');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

exports.onboardStudent = async (req, res) => {
    try {
        const { gender, category, state, guardianContact, dob } = req.body;
        
        const student = await VacStudent.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        student.gender = gender;
        student.category = category;
        student.state = state;
        student.guardianContact = guardianContact;
        student.dob = dob;
        student.isOnboarded = true;

        await student.save();

        res.status(200).json({ message: "Onboarding successful", student });
    } catch (error) {
        res.status(500).json({ message: "Server error during onboarding" });
    }
};

exports.getStudentDashboardScores = async (req, res) => {
    try {
        const rollNo = req.user.vac_rollNo;

        // Fetch all related records for this specific student
        const internal = await InternalTestRecord.findOne({ vac_rollNo: rollNo });
        const practical = await PracticalRecord.findOne({ vac_rollNo: rollNo });
        const ca = await ContinuousAssessment.findOne({ vac_rollNo: rollNo });
        const master = await MasterRecord.findOne({ vac_rollNo: rollNo });

        // Structure the response based on the dashboard tabs we designed
        const dashboardData = {
            online_test: {
                internal1: internal?.internal1 || 'N/A',
                internal2: internal?.internal2 || 'N/A',
                internal3: internal?.internal3 || 'N/A'
            },
            practical_test: {
                score: practical?.practicalMarks || 'N/A'
            },
            continuous_assessment: {
                attendance: ca?.attendanceMarks || 'N/A',
                assessment: ca?.assessmentMarks || 'N/A',
                presentation: ca?.presentationMarks || 'N/A'
            },
            finalResult: master ? {
                totalMarks: master.totalMarks,
                grade: master.finalGrade,
                result: master.result
            } : null
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ message: "Server error fetching scores" });
    }
};

exports.fetchQuestions = async (req, res) => {
    try {
        const { testType } = req.params;
        const settings = await SystemSettings.findOne({ testType });
        if (!settings || !settings.isActive) {
            return res.status(403).json({ message: "Test is not active" });
        }
        
        const questions = await Question.find({ testType }).select('-correctOption');
        res.status(200).json(questions);
    } catch (error) {
        console.error("Fetch Questions Error:", error);
        res.status(500).json({ message: "Error fetching questions" });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { testType } = req.params;
        const { answers } = req.body; 
        const rollNo = req.user.vac_rollNo;

        const settings = await SystemSettings.findOne({ testType });
        if (!settings || !settings.isActive) {
            return res.status(403).json({ message: "Test is not active or closed" });
        }

        let score = 0;
        for (const ans of answers) {
            const question = await Question.findById(ans.questionId);
            if (question && question.correctOption === ans.selectedOption) {
                score += 1;
            }
        }

        let record = await InternalTestRecord.findOne({ vac_rollNo: rollNo });
        if (!record) {
            record = new InternalTestRecord({ vac_rollNo: rollNo, vac_studentId: req.user._id });
        }

        const typeMap = { 'internal_1': 'internal1', 'internal_2': 'internal2', 'internal_3': 'internal3' };
        if (typeMap[testType]) {
            record[typeMap[testType]] = score;
        }
        await record.save();

        res.status(200).json({ message: "Test submitted successfully", score });
    } catch (error) {
        console.error("Submit Test Error:", error);
        res.status(500).json({ message: "Error submitting test" });
    }
};
