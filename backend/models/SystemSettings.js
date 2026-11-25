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

  // Batch & Course Information
  currentBatch: { type: String, default: '2026-2027' },

  // Weekly Timetable Configuration
  timetableDays: { type: [String], default: ['Monday', 'Wednesday', 'Friday'] },
  timetableTime: { type: String, default: '10:00 AM - 11:00 AM' },
  timetableInstructor: { type: String, default: "CTO sir / ma'am" },
  timetableVenue: { type: String, default: 'NCC Department' },

  // Cloudflare R2 Document URLs
  syllabusUrl: { type: String, default: null },
  notesUnit1: { type: String, default: null },
  notesUnit2: { type: String, default: null },
  notesUnit3: { type: String, default: null },
  notesUnit4: { type: String, default: null },
  notesUnit5: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
