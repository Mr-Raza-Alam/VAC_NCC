const TestSettings = require('../models/TestSettings');
const Question = require('../models/Question');
const VacStudent = require('../models/VacStudent');
const InternalTestRecord = require('../models/InternalTestRecord');
const PracticalRecord = require('../models/PracticalRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const fs = require('fs');
const csv = require('csv-parser');

// Save or Update Settings
exports.saveSettings = async (req, res) => {
    try {
        const { testType, duration, marksPerQuestion, resultsVisibility, testDate, startTime, endTime, isActive, isFinalized } = req.body;
        if (!testType) return res.status(400).json({ message: "testType is required" });

        let settings = await TestSettings.findOne({ testType });
        if (settings) {
            if (duration !== undefined) settings.duration = duration;
            if (marksPerQuestion !== undefined) settings.marksPerQuestion = marksPerQuestion;
            if (resultsVisibility !== undefined) settings.resultsVisibility = resultsVisibility;
            if (testDate !== undefined) settings.testDate = testDate;
            if (startTime !== undefined) settings.startTime = startTime;
            if (endTime !== undefined) settings.endTime = endTime;
            if (isActive !== undefined) settings.isActive = isActive;
            if (isFinalized !== undefined) settings.isFinalized = isFinalized;
            await settings.save();
        } else {
            settings = await TestSettings.create(req.body);
        }
        res.status(200).json({ message: "Settings saved successfully", settings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get Settings
exports.getSettings = async (req, res) => {
    try {
        const { testType } = req.params;
        const settings = await TestSettings.findOne({ testType });
        res.status(200).json(settings || {});
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get All Settings
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await TestSettings.find({});
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Verify and Finalize Phase (Cross-Verification logic)
exports.verifyAndFinalizePhase = async (req, res) => {
    try {
        const { testType, tableData } = req.body;
        if (!testType) return res.status(400).json({ message: "testType is required" });

        // Map 'internal_1' to 'Int-1' globally for this function
        const testMap = { 'internal_1': 'Int-1', 'internal_2': 'Int-2', 'internal_3': 'Int-3' };
        const dbTestType = testMap[testType] || testType;

        // Ensure there is data submitted
        if (!tableData || Object.keys(tableData).length === 0) {
            return res.status(400).json({ message: "Cannot finalize: No student grading data provided." });
        }

        // STRICT VERIFICATION: Ensure all present ('P') students have complete scores
        // AND ensure all students have an attendance explicitly marked
        for (const [rollNo, data] of Object.entries(tableData)) {
            if (!data.att || data.att === '') {
                return res.status(400).json({ message: `Student ${rollNo} has no attendance marked. Cannot finalize.` });
            }

            if (data.att === 'P') {
                if (testType.startsWith('internal_')) {
                    if (data.score === undefined || data.score === null || data.score === '') {
                        return res.status(400).json({ message: `Student ${rollNo} is Present but missing a CBT score. Cannot finalize.` });
                    }
                } else if (testType === 'practical') {
                    if (data.score === undefined || data.score === null || data.score === '') {
                        return res.status(400).json({ message: `Student ${rollNo} is Present but missing a Practical score. Cannot finalize.` });
                    }
                } else if (testType === 'ca') {
                    if (data.ass === undefined || data.ass === '' || data.present === undefined || data.present === '') {
                        return res.status(400).json({ message: `Student ${rollNo} is Present but missing Assignment/Presentation scores. Cannot finalize.` });
                    }
                }
            }
        }

        // If strict verification passes, lock the phase!
        let settings = await TestSettings.findOne({ testType: dbTestType });
        if (settings) {
            settings.isFinalized = true;
            settings.isActive = false;
            await settings.save();
        } else {
            settings = await TestSettings.create({ testType: dbTestType, isFinalized: true, isActive: false });
        }

        // SAVE THE DATA TO THE DATABASES!
        for (const [rollNo, data] of Object.entries(tableData)) {
            const student = await VacStudent.findOne({ vac_rollNo: rollNo });
            if (!student) continue;

            if (testType.startsWith('internal_')) {
                const updatePayload = { attendance: data.att || '' };
                if (data.score !== undefined && data.score !== '') {
                    updatePayload.score = Number(data.score) || 0;
                }
                
                await InternalTestRecord.findOneAndUpdate(
                    { student: student._id, testType: dbTestType },
                    { $set: updatePayload },
                    { upsert: true, new: true }
                );
            } else if (testType === 'practical') {
                const updatePayload = { attendance: data.att || '' };
                if (data.score !== undefined && data.score !== '') {
                    updatePayload.score = Number(data.score) || 0;
                }

                await PracticalRecord.findOneAndUpdate(
                    { student: student._id },
                    { $set: updatePayload },
                    { upsert: true, new: true }
                );
            } else if (testType === 'ca') {
                await ContinuousAssessment.findOneAndUpdate(
                    { student: student._id },
                    { 
                        attendance: data.att === 'P' ? 1 : 0, // Wait, CA schema is numerical for attendance? The model says attendance: Number. But frontend sends 'P' or 'A'. We will store 'P'/'A' on frontend logic? 
                        // Ah, wait. Frontend sends data.att (P/A) and data.present (number 0-5). Let's use data.present!
                        attendance: Number(data.present) || 0,
                        assignment: Number(data.ass) || 0,
                        presentation: 0 // Frontend doesn't seem to have presentation field currently, keeping it 0
                    },
                    { upsert: true, new: true }
                );
            }
        }

        res.status(200).json({ message: `${testType} finalized successfully!`, settings });
    } catch (err) {
        res.status(500).json({ message: "Server error during verification", error: err.message });
    }
};

exports.getMasterResults = async (req, res) => {
    try {
        const students = await VacStudent.find({}, '-password').lean();
        
        // Fetch all finalized data
        const internal1 = await InternalTestRecord.find({ testType: 'Int-1' }).populate('student', 'vac_rollNo');
        const internal2 = await InternalTestRecord.find({ testType: 'Int-2' }).populate('student', 'vac_rollNo');
        const internal3 = await InternalTestRecord.find({ testType: 'Int-3' }).populate('student', 'vac_rollNo');
        const practicals = await PracticalRecord.find().populate('student', 'vac_rollNo');
        const cas = await ContinuousAssessment.find().populate('student', 'vac_rollNo');

        // Create fast lookup maps by rollNo
        const buildMap = (records) => {
            const map = {};
            records.forEach(r => {
                if (r.student && r.student.vac_rollNo) {
                    map[r.student.vac_rollNo] = r;
                }
            });
            return map;
        };

        const mapInt1 = buildMap(internal1);
        const mapInt2 = buildMap(internal2);
        const mapInt3 = buildMap(internal3);
        const mapPrac = buildMap(practicals);
        const mapCA = buildMap(cas);

        const masterData = students.map(st => {
            const i1 = mapInt1[st.vac_rollNo];
            const i2 = mapInt2[st.vac_rollNo];
            const i3 = mapInt3[st.vac_rollNo];
            const prac = mapPrac[st.vac_rollNo];
            const ca = mapCA[st.vac_rollNo];

            // Safely calculate Int-Score (sum of Int-1, Int-2, Int-3)
            let intScore = 0;
            if (i1 && i1.attendance === 'P') intScore += i1.score;
            if (i2 && i2.attendance === 'P') intScore += i2.score;
            if (i3 && i3.attendance === 'P') intScore += i3.score;

            // CA Total
            let caScore = 0;
            if (ca) {
                // If the student was present in CA phase (we assume if they exist and have scores)
                caScore = (ca.assignment || 0) + (ca.attendance || 0); // we used 'attendance' for 'present'
            }

            // Practical
            let pracScore = 0;
            if (prac && prac.attendance === 'P') {
                pracScore = prac.score;
            }

            const total = intScore + caScore + pracScore;

            return {
                ...st,
                int1: i1 ? (i1.attendance === 'A' ? 'Ab' : i1.score) : '-',
                int2: i2 ? (i2.attendance === 'A' ? 'Ab' : i2.score) : '-',
                int3: i3 ? (i3.attendance === 'A' ? 'Ab' : i3.score) : '-',
                intScore: intScore,
                ca: ca ? caScore : '-',
                pract: prac ? (prac.attendance === 'A' ? 'Ab' : pracScore) : '-',
                total: total
            };
        });

        res.status(200).json(masterData);
    } catch (err) {
        res.status(500).json({ message: "Server error generating master results", error: err.message });
    }
};

// Upload Questions CSV
exports.uploadQuestions = async (req, res) => {
    try {
        const testType = req.body.testType;
        if (!testType) return res.status(400).json({ message: "testType is required" });
        if (!req.file) return res.status(400).json({ message: "CSV file is required" });

        const results = [];
        let parseError = null;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                // Expected columns: QuestionText, Option1, Option2, Option3, Option4, CorrectAnswer
                if (!data.QuestionText || !data.Option1 || !data.Option2 || !data.Option3 || !data.Option4 || !data.CorrectAnswer) {
                    parseError = "Invalid CSV format. Please ensure columns: QuestionText, Option1, Option2, Option3, Option4, CorrectAnswer exist.";
                } else {
                    results.push({
                        testType,
                        questionText: data.QuestionText,
                        options: [data.Option1, data.Option2, data.Option3, data.Option4],
                        correctAnswer: data.CorrectAnswer
                    });
                }
            })
            .on('end', async () => {
                // Remove the temp file
                fs.unlinkSync(req.file.path);

                if (parseError) return res.status(400).json({ message: parseError });
                if (results.length === 0) return res.status(400).json({ message: "CSV is empty" });

                // Append new questions (DO NOT delete existing ones per user request)
                await Question.insertMany(results);

                res.status(200).json({ message: `Successfully appended ${results.length} questions to ${testType} bank.` });
            });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getLiveTableData = async (req, res) => {
    try {
        const internals = await InternalTestRecord.find().populate('student', 'vac_rollNo');
        const practicals = await PracticalRecord.find().populate('student', 'vac_rollNo');
        const cas = await ContinuousAssessment.find().populate('student', 'vac_rollNo');

        const tableData = {};
        
        const initStudent = (rollNo) => {
            if (!tableData[rollNo]) tableData[rollNo] = {};
        };

        const testMapRev = { 'Int-1': 'internal_1', 'Int-2': 'internal_2', 'Int-3': 'internal_3' };

        internals.forEach(r => {
            if (r.student && r.student.vac_rollNo) {
                const rollNo = r.student.vac_rollNo;
                initStudent(rollNo);
                const phase = testMapRev[r.testType];
                if (phase) {
                    tableData[rollNo][phase] = { att: r.attendance, score: r.score };
                }
            }
        });

        practicals.forEach(r => {
            if (r.student && r.student.vac_rollNo) {
                const rollNo = r.student.vac_rollNo;
                initStudent(rollNo);
                tableData[rollNo]['practical'] = { att: r.attendance, score: r.score };
            }
        });

        cas.forEach(r => {
            if (r.student && r.student.vac_rollNo) {
                const rollNo = r.student.vac_rollNo;
                initStudent(rollNo);
                // Convert numerical attendance back to P/A for frontend state
                const att = (r.attendance > 0 || r.assignment > 0) ? 'P' : ''; 
                // Note: since frontend uses P/A, we map it roughly. 
                // If we want exact, we need the exact P/A. But let's let frontend handle it or just return what we have.
                // Actually, frontend uses 'att' for P/A. Let's just trust the P/A logic in CA isn't strictly necessary or we just pass it.
                // Wait, CA attendance is 0-5. So att="P" is just a UI toggle. We'll leave att="" if 0.
                tableData[rollNo]['ca'] = { att: r.attendance > 0 ? 'P' : '', ass: r.assignment, present: r.attendance };
            }
        });

        res.status(200).json(tableData);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching live data", error: err.message });
    }
};

exports.updateLiveTableData = async (req, res) => {
    try {
        const { rollNo, phaseKey, field, value } = req.body;
        const student = await VacStudent.findOne({ vac_rollNo: rollNo });
        if (!student) return res.status(404).json({ message: "Student not found" });

        if (phaseKey.startsWith('internal_')) {
            const testMap = { 'internal_1': 'Int-1', 'internal_2': 'Int-2', 'internal_3': 'Int-3' };
            const dbTestType = testMap[phaseKey];
            
            const update = {};
            if (field === 'att') update.attendance = value;
            if (field === 'score') update.score = Number(value) || 0;

            await InternalTestRecord.findOneAndUpdate(
                { student: student._id, testType: dbTestType },
                { $set: update },
                { upsert: true, new: true }
            );
        } else if (phaseKey === 'practical') {
            const update = {};
            if (field === 'att') update.attendance = value;
            if (field === 'score') update.score = Number(value) || 0;

            await PracticalRecord.findOneAndUpdate(
                { student: student._id },
                { $set: update },
                { upsert: true, new: true }
            );
        } else if (phaseKey === 'ca') {
            const update = {};
            // For CA, field is 'att', 'ass', or 'present'
            // But 'att' is purely a UI toggle, it's not in schema as String, it's Number. 
            // We ignore 'att' saves to DB for CA, or we save it? Schema says attendance: Number.
            // Let's only update if field is 'ass' or 'present'
            if (field === 'ass') update.assignment = Number(value) || 0;
            if (field === 'present') update.attendance = Number(value) || 0;

            if (Object.keys(update).length > 0) {
                await ContinuousAssessment.findOneAndUpdate(
                    { student: student._id },
                    { $set: update },
                    { upsert: true, new: true }
                );
            }
        }

        res.status(200).json({ message: "Updated live data" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getTransparencyReport = async (req, res) => {
    try {
        const testType = req.params.testType;
        if (!['Int-1', 'Int-2', 'Int-3'].includes(testType)) {
            return res.status(400).json({ message: "Invalid test type for transparency report." });
        }
        
        const records = await InternalTestRecord.find({ testType }).populate('student', 'name vac_rollNo department').lean();
        const questions = await Question.find({ testType }).lean();
        
        const formattedData = records.map(record => {
            const data = {
                Name: record.student?.name || 'Unknown',
                'Roll No.': record.student?.vac_rollNo || 'Unknown',
                Department: record.student?.department || 'Unknown',
                Attendance: record.attendance,
                Score: record.score
            };
            
            // Map each question to a column Q1, Q2, Q3...
            questions.forEach((q, index) => {
                const colName = `Q${index + 1}`;
                if (record.answers && record.answers[q._id.toString()]) {
                    data[colName] = record.answers[q._id.toString()];
                } else {
                    data[colName] = ''; // Blank if unattempted
                }
            });
            
            return data;
        });

        res.status(200).json(formattedData);
    } catch (err) {
        res.status(500).json({ message: "Server error generating transparency report", error: err.message });
    }
};
