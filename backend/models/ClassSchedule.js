const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Unit 1: Introduction"
  date: { type: String, required: true }, // Using String to prevent timezone issues, just like TestSettings
  time: { type: String, required: true }, // e.g. "10:00 AM"
  type: { type: String, enum: ['Physical', 'Virtual'], required: true },
  zoomLink: { type: String, default: '' }, // Only used if Virtual
  attendanceActive: { type: Boolean, default: false }, // Admin toggles this to true when class starts
}, { timestamps: true });

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
