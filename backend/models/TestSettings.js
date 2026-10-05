const mongoose = require('mongoose');

const testSettingsSchema = new mongoose.Schema({
  testType: { type: String, enum: ['Int-1', 'Int-2', 'Int-3', 'practical', 'ca'], required: true, unique: true },
  duration: { type: Number, default: 30 },
  marksPerQuestion: { type: Number, default: 1 },
  resultsVisibility: { type: String, enum: ['OFF', 'ON'], default: 'OFF' },
  testDate: { type: String }, // e.g. "2026-10-15"
  startTime: { type: String }, // e.g. "10:00"
  endTime: { type: String }, // e.g. "11:00"
  isActive: { type: Boolean, default: false },
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('TestSettings', testSettingsSchema);
