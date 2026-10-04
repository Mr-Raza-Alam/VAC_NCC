const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const VacStudent = require('../models/VacStudent');

exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        res.status(200).json({ 
            message: "Login successful", 
            role: admin.role,
            permissions: admin.permissions || [] 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password').sort({ createdAt: 1 });
        res.status(200).json(admins);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        const admin = await Admin.findById(id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        if (admin.role === 'lead_admin') {
            return res.status(403).json({ message: "Cannot modify lead admin permissions" });
        }

        admin.permissions = permissions;
        await admin.save();

        res.status(200).json({ message: "Permissions updated successfully", admin });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.studentRegister = async (req, res) => {
    try {
        const { vac_rollNo, email, password } = req.body;
        
        if (!vac_rollNo || !password) return res.status(400).json({ message: "Roll Number and password are required" });

        // Check if student exists (uploaded by admin via CSV)
        const student = await VacStudent.findOne({ vac_rollNo: vac_rollNo.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: "Student record not found. Please contact administration." });
        }

        // Check if already registered (password is already set)
        if (student.password) {
            return res.status(400).json({ message: "Student is already registered. Please login." });
        }

        // Check if email is already in use
        const existingEmail = await VacStudent.findOne({ email });
        if (existingEmail && existingEmail.vac_rollNo !== student.vac_rollNo) {
            return res.status(400).json({ message: "Email is already registered to another student." });
        }

        // Hash password and save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        student.email = email;
        student.password = hashedPassword;
        await student.save();

        // Generate JWT for auto-login
        const token = jwt.sign(
            { id: student._id, vac_rollNo: student.vac_rollNo, role: 'student' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '72h' }
        );

        res.status(200).json({ 
            message: "Registration successful! You are now logged in.",
            token,
            student: {
                name: student.name,
                vac_rollNo: student.vac_rollNo,
                isOnboarded: student.isOnboarded
            }
        });
    } catch (error) {
        console.error("Student Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

exports.studentLogin = async (req, res) => {
    try {
        const { vac_rollNo, password } = req.body;
        
        if (!vac_rollNo || !password) {
            return res.status(400).json({ message: "Roll Number and password are required." });
        }
        
        const student = await VacStudent.findOne({ vac_rollNo: vac_rollNo.toUpperCase() });
        if (!student || !student.password) {
            return res.status(401).json({ message: "Invalid credentials or not registered yet." });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: student._id, vac_rollNo: student.vac_rollNo, role: 'student' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '72h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            student: {
                name: student.name,
                vac_rollNo: student.vac_rollNo,
                isOnboarded: student.isOnboarded
            }
        });
    } catch (error) {
        console.error("Student Login Error:", error);
        res.status(500).json({ message: "Server error during login: " + error.message });
    }
};
