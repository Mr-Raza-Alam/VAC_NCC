const mongoose = require('mongoose');

const masterRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'VacStudent', required: true, unique: true },
  manualStatus: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('MasterRecord', masterRecordSchema);
