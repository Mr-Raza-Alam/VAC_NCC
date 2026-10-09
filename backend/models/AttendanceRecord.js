const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'VacStudent', required: true },
  classSchedule: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSchedule', required: true },
  status: { type: String, enum: ['Present'], default: 'Present' }, // We only record Present. If no record exists, they are Absent.
  markedAt: { type: Date, default: Date.now },
  distanceMeters: { type: Number }, // To optionally log how close they were (good for audits)
  ipAddress: { type: String } // Optional security layer
}, { timestamps: true });

// Ensure a student can only be marked present once per class
attendanceRecordSchema.index({ student: 1, classSchedule: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
