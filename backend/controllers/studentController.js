const VacStudent = require('../models/VacStudent');
const InternalTestRecord = require('../models/InternalTestRecord');
const PracticalRecord = require('../models/PracticalRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const MasterRecord = require('../models/MasterRecord');

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
