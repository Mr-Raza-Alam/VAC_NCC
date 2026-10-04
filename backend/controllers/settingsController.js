const bcrypt = require('bcryptjs');
const SystemSettings = require('../models/SystemSettings');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const VacStudent = require('../models/VacStudent');
const InternalTestRecord = require('../models/InternalTestRecord');
const PracticalRecord = require('../models/PracticalRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const TestSettings = require('../models/TestSettings');

const getGlobalSettings = async () => {
    let settings = await SystemSettings.findOne({ identifier: 'global' });
    if (!settings) {
        settings = await SystemSettings.create({ identifier: 'global' });
    }
    return settings;
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await getGlobalSettings();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateBroadcast = async (req, res) => {
    try {
        const { broadcastMessage, targetPage, broadcastActive } = req.body;
        const settings = await getGlobalSettings();
        
        settings.broadcastMessage = broadcastMessage !== undefined ? broadcastMessage : settings.broadcastMessage;
        settings.targetPage = targetPage !== undefined ? targetPage : settings.targetPage;
        settings.broadcastActive = broadcastActive !== undefined ? broadcastActive : settings.broadcastActive;
        
        await settings.save();
        res.status(200).json({ message: "Broadcast updated successfully", settings });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.executeReset = async (req, res) => {
    try {
        const { resetTarget, adminUsername, password } = req.body;

        const admin = await Admin.findOne({ username: adminUsername });
        if (!admin) return res.status(401).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid password authorization" });

        if (admin.role !== 'lead_admin') {
            return res.status(403).json({ message: "Only Lead Admin can execute a reset" });
        }

        if (resetTarget === 'Nuclear Reset (Everything - New Batch)') {
            await VacStudent.deleteMany({});
            await InternalTestRecord.deleteMany({});
            await PracticalRecord.deleteMany({});
            await ContinuousAssessment.deleteMany({});
            await TestSettings.deleteMany({});
            
            await AuditLog.create({
                action: 'Nuclear Reset',
                performedBy: admin.username,
                details: 'Cleared all student and test records for a new batch.'
            });

            return res.status(200).json({ message: "Nuclear Reset executed successfully." });
        } else if (resetTarget === 'Clear Test Records Only') {
            await InternalTestRecord.deleteMany({});
            await PracticalRecord.deleteMany({});
            await ContinuousAssessment.deleteMany({});
            await TestSettings.deleteMany({});
            
            await AuditLog.create({
                action: 'Test Records Reset',
                performedBy: admin.username,
                details: 'Cleared all test records and settings, but kept student enrollments.'
            });

            return res.status(200).json({ message: "Test records cleared successfully." });
        } else {
            return res.status(400).json({ message: "Unknown reset target." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during reset." });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(50);
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
