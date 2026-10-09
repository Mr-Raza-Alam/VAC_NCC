const ClassSchedule = require('../models/ClassSchedule');
const AttendanceRecord = require('../models/AttendanceRecord');
const ContinuousAssessment = require('../models/ContinuousAssessment');
const TestSettings = require('../models/TestSettings'); // Using TestSettings to hold classroom coordinates and rules
const VacStudent = require('../models/VacStudent');

// Haversine formula to calculate distance in meters between two coordinates
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in m
  return d;
}

// 1. Get all classes
exports.getClasses = async (req, res) => {
    try {
        const classes = await ClassSchedule.find().sort({ createdAt: -1 });
        res.status(200).json(classes);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 2. Schedule a new class (Admin)
exports.createClass = async (req, res) => {
    try {
        const { title, date, time, type, zoomLink } = req.body;
        const newClass = new ClassSchedule({ title, date, time, type, zoomLink });
        await newClass.save();
        res.status(201).json({ message: "Class scheduled successfully", class: newClass });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 3. Toggle Attendance Window (Admin)
exports.toggleAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        const updatedClass = await ClassSchedule.findByIdAndUpdate(id, { attendanceActive: active }, { new: true });
        res.status(200).json({ message: `Attendance window ${active ? 'Opened' : 'Closed'}`, class: updatedClass });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 4. Mark Attendance (Student)
exports.markAttendance = async (req, res) => {
    try {
        const { id } = req.params; // Class ID
        const { lat, lon } = req.body; // Student's location

        const student = await VacStudent.findOne({ vac_rollNo: req.user.rollNo });
        if (!student) return res.status(404).json({ message: "Student not found" });

        const classInfo = await ClassSchedule.findById(id);
        if (!classInfo) return res.status(404).json({ message: "Class not found" });

        if (!classInfo.attendanceActive) {
            return res.status(400).json({ message: "Attendance window is closed!" });
        }

        let distanceMeters = 0;

        // If Physical class, strictly check Geofence
        if (classInfo.type === 'Physical') {
            if (!lat || !lon) {
                return res.status(400).json({ message: "Location is required for physical classes." });
            }

            // NOTE: We will grab the classroom coordinates from a system settings object or hardcode them temporarily.
            // Temporary hardcode (will be replaced by Admin provided coordinates)
            const CLASS_LAT = 28.6139; // Replace tomorrow
            const CLASS_LON = 77.2090; // Replace tomorrow
            const ALLOWED_RADIUS = 5; // 5 meters

            distanceMeters = getDistanceFromLatLonInMeters(lat, lon, CLASS_LAT, CLASS_LON);

            if (distanceMeters > ALLOWED_RADIUS) {
                return res.status(400).json({ 
                    message: `Geofence Violation! You are ${Math.round(distanceMeters)} meters away from the classroom. Get within 5 meters to mark attendance.`,
                    distance: Math.round(distanceMeters)
                });
            }
        }

        // Create or update attendance record
        const record = await AttendanceRecord.findOneAndUpdate(
            { student: student._id, classSchedule: id },
            { status: 'Present', distanceMeters },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Attendance marked successfully!", record });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Attendance already marked." });
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 5. Auto-Calculate CA Attendance Marks (Admin)
exports.autoCalculateCAMarks = async (req, res) => {
    try {
        const allStudents = await VacStudent.find();
        const totalClasses = await ClassSchedule.countDocuments();
        
        if (totalClasses === 0) return res.status(400).json({ message: "No classes have been conducted yet." });

        // Iterate through all students and calculate their marks
        for (let student of allStudents) {
            const attendedCount = await AttendanceRecord.countDocuments({ student: student._id });
            const attendancePercentage = (attendedCount / totalClasses) * 100;

            let marks = 0;
            // NOTE: These rules will be confirmed by user tomorrow
            if (attendancePercentage >= 85) marks = 5;
            else if (attendancePercentage >= 75) marks = 4;
            else if (attendancePercentage >= 65) marks = 3;
            else if (attendancePercentage >= 50) marks = 2;
            else if (attendancePercentage >= 35) marks = 1;
            else marks = 0;

            await ContinuousAssessment.findOneAndUpdate(
                { student: student._id },
                { attendance: marks },
                { upsert: true }
            );
        }

        res.status(200).json({ message: "CA Attendance Marks auto-calculated and synced successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
