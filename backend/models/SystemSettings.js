const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Only one document should exist for global settings
  identifier: { type: String, default: 'global', unique: true },
  
  // Test Management
  testDurationMinutes: { type: Number, default: 30 },
  resultsVisibility: { type: String, enum: ['OFF', 'ON'], default: 'OFF' },
  testWindowStart: { type: Date, default: null },
  testWindowEnd: { type: Date, default: null },
  
  // Broadcast Notification
  broadcastMessage: { type: String, default: '' },
  targetPage: { type: String, default: 'None (Disabled)' },
  broadcastActive: { type: Boolean, default: false },

  // Cloudflare R2 Document URLs
  syllabusUrl: { type: String, default: null },
  notesUrl: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
