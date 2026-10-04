const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testType: {
    type: String,
    enum: ['Int-1', 'Int-2', 'Int-3'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }], // Array to hold exactly 4 options
  correctAnswer: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Validation to ensure exactly 4 options are provided
questionSchema.path('options').validate(function(value) {
  return value.length === 4;
}, 'Quiz questions must have exactly 4 options.');

module.exports = mongoose.model('Question', questionSchema);
