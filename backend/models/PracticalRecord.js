const mongoose = require('mongoose');

const practicalRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'VacStudent', required: true, unique: true },
  attendance: { type: String, enum: ['P', 'A', ''], default: '' },
  score: { type: Number, default: 0, min: 0, max: 20 }
}, { timestamps: true });

module.exports = mongoose.model('PracticalRecord', practicalRecordSchema);
