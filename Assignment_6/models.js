const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'name is required'], trim: true, maxlength: 80 },
    email: {
      type: String, required: [true, 'email is required'], trim: true, lowercase: true, unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is invalid'],
    },
    age: { type: Number, min: [15, 'age must be at least 15'], max: [100, 'age must be at most 100'] },
    course: { type: String, required: [true, 'course is required'], trim: true, maxlength: 60 },
    cgpa: { type: Number, min: 0, max: 10, default: 0 },
  },
  { timestamps: true }
);

module.exports = { Student: mongoose.model('Student', studentSchema) };
