const VacStudent = require('../models/VacStudent');
const InternalTestRecord = require('../models/InternalTestRecord');
const PracticalRecord = require('../models/PracticalRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const MasterRecord = require('../models/MasterRecord');
const Question = require('../models/Question');
const TestSettings = require('../models/TestSettings');

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
        const studentId = req.user.id;

        // Fetch all related records for this specific student
        const internal1 = await InternalTestRecord.findOne({ student: studentId, testType: 'Int-1' });
        const internal2 = await InternalTestRecord.findOne({ student: studentId, testType: 'Int-2' });
        const internal3 = await InternalTestRecord.findOne({ student: studentId, testType: 'Int-3' });
        const practical = await PracticalRecord.findOne({ student: studentId });
        const ca = await ContinuousAssessment.findOne({ student: studentId });
        const master = await MasterRecord.findOne({ vac_rollNo: req.user.vac_rollNo });

        // Structure the response based on the dashboard tabs we designed
        const dashboardData = {
            online_test: {
                internal1: internal1 ? { score: internal1.score, isSubmitted: internal1.isSubmitted } : null,
                internal2: internal2 ? { score: internal2.score, isSubmitted: internal2.isSubmitted } : null,
                internal3: internal3 ? { score: internal3.score, isSubmitted: internal3.isSubmitted } : null
            },
            practical_test: {
                score: practical ? practical.score : 'N/A'
            },
            continuous_assessment: {
                attendance: ca ? ca.attendance : 'N/A',
                assessment: ca ? ca.assignment : 'N/A',
                presentation: ca ? ca.presentation : 'N/A'
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
        const testTypeMap = { 'internal_1': 'Int-1', 'internal_2': 'Int-2', 'internal_3': 'Int-3' };
        const tType = testTypeMap[testType] || testType;

        const settings = await TestSettings.findOne({ testType: tType });
        if (!settings || !settings.isActive) {
            return res.status(403).json({ message: "Test is not active" });
        }
        
        const questions = await Question.find({ testType: tType }).select('-correctOption -correctAnswer');
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
        const studentId = req.user.id;

        const testTypeMap = { 'internal_1': 'Int-1', 'internal_2': 'Int-2', 'internal_3': 'Int-3' };
        const tType = testTypeMap[testType] || testType;

        const settings = await TestSettings.findOne({ testType: tType });
        if (!settings || !settings.isActive) {
            return res.status(403).json({ message: "Test is not active or closed" });
        }

        let score = 0;
        const savedAnswers = {};
        const marksPerQuestion = Number(settings.marksPerQuestion) || 1;
        
        for (const ans of answers) {
            savedAnswers[ans.questionId] = ans.selectedOption;
            const question = await Question.findById(ans.questionId);
            // Support both correctAnswer and correctOption based on schema evolution
            if (question && (question.correctAnswer === ans.selectedOption || question.correctOption === ans.selectedOption)) {
                score += marksPerQuestion;
            }
        }

        await InternalTestRecord.findOneAndUpdate(
            { student: studentId, testType: tType },
            { 
                score: score,
                answers: savedAnswers,
                attendance: 'P', // Mark present if they took the test
                isSubmitted: true
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Test submitted successfully", score });
    } catch (error) {
        console.error("Submit Test Error:", error);
        res.status(500).json({ message: "Error submitting test" });
    }
};

exports.getTestResultDetails = async (req, res) => {
    try {
        const studentId = req.user.id;
        const testType = req.params.testType; 

        const testTypeMap = { internal_1: 'Int-1', internal_2: 'Int-2', internal_3: 'Int-3' };
        const mappedType = testTypeMap[testType] || testType;
        const settings = await TestSettings.findOne({ testType: mappedType });

        if (!settings || (!settings.isFinalized && settings.resultsVisibility !== 'ON')) {
            return res.status(403).json({ message: "Results are not yet published for this test." });
        }

        const record = await InternalTestRecord.findOne({ student: studentId, testType: mappedType });
        if (!record) {
            return res.status(404).json({ message: "No test record found." });
        }

        const questions = await Question.find({ testType: mappedType }).sort({ createdAt: 1 });

        const resultDetails = questions.map((q, idx) => {
            const qIdStr = q._id.toString();
            const studentAns = record.answers && record.answers.get(qIdStr) ? record.answers.get(qIdStr) : 'Not Answered';
            const isCorrect = studentAns === q.correctAnswer;
            return {
                questionNo: `Q${idx + 1}`,
                questionText: q.questionText,
                studentAnswer: studentAns,
                correctAnswer: q.correctAnswer,
                isCorrect
            };
        });

        const student = await VacStudent.findById(studentId).select('name vac_rollNo department');

        res.status(200).json({
            studentDetails: {
                name: student.name,
                rollNo: student.vac_rollNo,
                department: student.department || 'N/A'
            },
            testDetails: {
                testType: mappedType,
                score: record.score,
                total: questions.length * (settings.marksPerQuestion || 1),
                submittedAt: record.updatedAt
            },
            resultDetails
        });

    } catch (err) {
        console.error("Result Details Error:", err);
        res.status(500).json({ message: "Server error fetching result details." });
    }
};
