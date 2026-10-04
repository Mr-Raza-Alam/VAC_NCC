const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['lead_admin', 'cto_sir', 'cto_maam'], 
    required: true 
  },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissions: [{ type: String }] // E.g., ['R1_SETUP', 'STUDENT_TABLE', 'SETTINGS']
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
