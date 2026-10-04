const mongoose = require('mongoose');

const vacStudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vac_rollNo: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: String, default: null },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, default: null },
  password: { type: String, default: null }, // Validated on route during student registration
  
  // Onboarding fields
  gender: { type: String, default: null },
  category: { type: String, default: null },
  state: { type: String, default: null },
  guardianContact: { type: String, default: null },
  dob: { type: Date, default: null },
  
  isOnboarded: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('VacStudent', vacStudentSchema);
