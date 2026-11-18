const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { Book } = require('./models');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' });

// Whitelist fields and force types (also blocks operator injection like {"$ne": ...})
function pick(b = {}) {
  const s = (v) => (typeof v === 'string' ? v : undefined);
  const out = { title: s(b.title), author: s(b.author), genre: s(b.genre) };
  if (b.year !== undefined && b.year !== '' && b.year !== null) out.year = Number(b.year);
  if (b.rating !== undefined && b.rating !== '' && b.rating !== null) out.rating = Number(b.rating);
  if (typeof b.available === 'boolean') out.available = b.available;
  const tags = Array.isArray(b.tags) ? b.tags : typeof b.tags === 'string' ? b.tags.split(',') : [];
  out.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10);
  const p = b.publisher || {};
  out.publisher = { name: s(p.name), country: s(p.country) };
  return out;
}

app.get('/health', (req, res) => res.send('ok'));

// READ: list with text search / filter / sort / pagination
app.get('/api/books', wrap(async (req, res) => {
  const { q, genre, available, minRating, tag, sort } = req.query;
  const filter = {};
  if (typeof q === 'string' && q.trim()) filter.$text = { $search: q.trim() };
  if (typeof genre === 'string' && genre) filter.genre = genre;
  if (available === 'true' || available === 'false') filter.available = available === 'true';
  if (typeof minRating === 'string' && minRating !== '' && !isNaN(minRating)) filter.rating = { $gte: Number(minRating) };
  if (typeof tag === 'string' && tag) filter.tags = tag.toLowerCase(); // array membership
  const allowed = ['title', '-title', 'year', '-year', 'rating', '-rating', '-createdAt'];
  const sortKey = allowed.includes(sort) ? sort : '-createdAt';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const [items, total] = await Promise.all([
    Book.find(filter).sort(sortKey).skip((page - 1) * limit).limit(limit),
    Book.countDocuments(filter),
  ]);
  res.json({ items, total, page });
}));

// AGGREGATION pipeline: group by genre, unwind tags
app.get('/api/stats', wrap(async (req, res) => {
  const byGenre = await Book.aggregate([
    { $group: { _id: '$genre', count: { $sum: 1 }, avgRating: { $avg: '$rating' }, available: { $sum: { $cond: ['$available', 1, 0] } } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, genre: '$_id', count: 1, available: 1, avgRating: { $round: ['$avgRating', 2] } } },
  ]);
  const topTags = await Book.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 8 },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);
  res.json({ byGenre, topTags, total: await Book.countDocuments() });
}));

app.get('/api/books/:id', validId, wrap(async (req, res) => {
  const b = await Book.findById(req.params.id);
  b ? res.json(b) : res.status(404).json({ error: 'Not found' });
}));

// CREATE
app.post('/api/books', wrap(async (req, res) => {
  res.status(201).json(await Book.create(pick(req.body)));
}));

// UPDATE
app.put('/api/books/:id', validId, wrap(async (req, res) => {
  const b = await Book.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  b ? res.json(b) : res.status(404).json({ error: 'Not found' });
}));

// Partial update: toggle availability
app.patch('/api/books/:id/toggle', validId, wrap(async (req, res) => {
  const b = await Book.findById(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  b.available = !b.available;
  res.json(await b.save());
}));

// DELETE
app.delete('/api/books/:id', validId, wrap(async (req, res) => {
  const b = await Book.findByIdAndDelete(req.params.id);
  b ? res.json({ deleted: true }) : res.status(404).json({ error: 'Not found' });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = {};
    for (const [k, v] of Object.entries(err.errors)) errors[k] = v.message;
    return res.status(422).json({ error: 'Validation failed', errors });
  }
  if (err.name === 'CastError') return res.status(422).json({ error: 'Validation failed', errors: { [err.path]: 'Invalid value' } });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
