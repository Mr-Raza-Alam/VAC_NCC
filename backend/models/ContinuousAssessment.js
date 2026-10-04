const mongoose = require('mongoose');

const continuousAssessmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'VacStudent', required: true, unique: true },
  attendance: { type: Number, default: 0, min: 0, max: 5 },
  assignment: { type: Number, default: 0, min: 0, max: 5 },
  presentation: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

// Virtual to automatically calculate total CA score
continuousAssessmentSchema.virtual('totalScore').get(function() {
  return (this.attendance || 0) + (this.assignment || 0) + (this.presentation || 0);
});

continuousAssessmentSchema.set('toJSON', { virtuals: true });
continuousAssessmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ContinuousAssessment', continuousAssessmentSchema);
