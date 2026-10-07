const VacStudent = require('../models/VacStudent');
const fs = require('fs');
const csv = require('csv-parser');

exports.uploadVacStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "CSV file is required" });

        const results = [];
        let parseError = null;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                // Clean the keys (remove trailing spaces in headers if any)
                const cleanData = {};
                for (let key in data) {
                    cleanData[key.trim()] = data[key];
                }

                // Support the user's specific CSV header format
                const name = cleanData['Name Of the Student'] || cleanData['Name'] || cleanData['name'];
                const rollNo = cleanData['Roll Number'] || cleanData['Roll No.'] || cleanData['RollNo'] || cleanData['vac_rollNo'];
                const department = cleanData['Dept.'] || cleanData['Dept'] || cleanData['Department'];
                const email = cleanData['Email ID'] || cleanData['Email'] || cleanData['email'];
                const mobile = cleanData['Mobile No.'] || cleanData['Mobile'] || cleanData['mobile'];

                if (!name || !rollNo || !department) {
                    parseError = "Invalid CSV format. Ensure columns: 'Roll Number', 'Name Of the Student', and 'Dept.' exist.";
                } else {
                    results.push({
                        name: name.trim(),
                        vac_rollNo: rollNo.trim(),
                        department: department.trim(),
                        email: email ? email.trim() : null,
                        mobile: mobile ? mobile.trim() : null
                    });
                }
            })
            .on('end', async () => {
                // Remove the temp file
                fs.unlinkSync(req.file.path);

                if (parseError) return res.status(400).json({ message: parseError });
                if (results.length === 0) return res.status(400).json({ message: "CSV is empty" });

                // We use an upsert approach so we don't accidentally delete students who have already registered and populated their profile fields.
                let addedCount = 0;
                let updatedCount = 0;

                for (let student of results) {
                    const existing = await VacStudent.findOne({ vac_rollNo: student.vac_rollNo });
                    if (existing) {
                        existing.name = student.name;
                        existing.department = student.department;
                        if (student.email) existing.email = student.email;
                        if (student.mobile) existing.mobile = student.mobile;
                        await existing.save();
                        updatedCount++;
                    } else {
                        await VacStudent.create(student);
                        addedCount++;
                    }
                }

                res.status(200).json({ message: `Successfully processed ${results.length} student records. Added: ${addedCount}, Updated: ${updatedCount}.` });
            });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getVacStudents = async (req, res) => {
    try {
        const students = await VacStudent.find({}, '-password'); // Send data back without passwords
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateVacStudent = async (req, res) => {
    try {
        const { rollNo } = req.params;
        const updateData = req.body;
        
        // Don't allow updating rollNo since it's the primary identifier here, 
        // or handle it safely. We'll allow other fields.
        delete updateData.vac_rollNo;
        
        const updatedStudent = await VacStudent.findOneAndUpdate(
            { vac_rollNo: rollNo },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
    } catch (err) {
        res.status(500).json({ message: "Server error during update", error: err.message });
    }
};

exports.deleteVacStudent = async (req, res) => {
    try {
        const { rollNo } = req.params;
        const deletedStudent = await VacStudent.findOneAndDelete({ vac_rollNo: rollNo });
        
        if (!deletedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.status(200).json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error during deletion", error: err.message });
    }
};

exports.addVacStudentManually = async (req, res) => {
    try {
        const { students } = req.body;
        
        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: "No students provided." });
        }

        const addedStudents = [];
        const errors = [];

        for (const student of students) {
            const { name, rollNo, department } = student;
            
            if (!name || !rollNo || !department) {
                errors.push(`Missing fields for student: ${name || 'Unknown'}`);
                continue;
            }

            const existing = await VacStudent.findOne({ vac_rollNo: rollNo.trim() });
            if (existing) {
                errors.push(`Student with Roll No ${rollNo} already exists.`);
                continue;
            }

            const newStudent = new VacStudent({
                name: name.trim(),
                vac_rollNo: rollNo.trim(),
                department: department.trim()
            });

            await newStudent.save();
            addedStudents.push(newStudent);
        }

        if (addedStudents.length === 0) {
            return res.status(400).json({ message: "Failed to add any students.", errors });
        }

        let message = `Successfully added ${addedStudents.length} student(s).`;
        if (errors.length > 0) {
            message += ` However, ${errors.length} failed.`;
        }

        res.status(201).json({ message, addedStudents, errors });
    } catch (err) {
        res.status(500).json({ message: "Server error adding students", error: err.message });
    }
};
