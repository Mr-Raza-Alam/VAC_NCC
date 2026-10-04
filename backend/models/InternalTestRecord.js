const mongoose = require('mongoose');

const internalTestRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'VacStudent', required: true },
  testType: { type: String, enum: ['Int-1', 'Int-2', 'Int-3'], required: true },
  attendance: { type: String, enum: ['P', 'A', ''], default: '' },
  score: { type: Number, default: 0 },
  answers: { type: Map, of: String } // Stores answers like { "q1_id": "Option A" }
}, { timestamps: true });

// Ensure one record per student per test type
internalTestRecordSchema.index({ student: 1, testType: 1 }, { unique: true });

module.exports = mongoose.model('InternalTestRecord', internalTestRecordSchema);
