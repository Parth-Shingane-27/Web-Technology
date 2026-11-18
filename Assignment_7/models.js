const mongoose = require('mongoose');

// Documents are schema-flexible: nested object (publisher), array (tags), optional fields.
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    genre: { type: String, required: true, trim: true, maxlength: 40 },
    year: { type: Number, min: 1000, max: 2100 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    available: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    publisher: {
      name: { type: String, trim: true, maxlength: 80 },
      country: { type: String, trim: true, maxlength: 60 },
    },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', tags: 'text' }); // full-text search
bookSchema.index({ genre: 1, rating: -1 });                         // compound index

module.exports = { Book: mongoose.model('Book', bookSchema) };
