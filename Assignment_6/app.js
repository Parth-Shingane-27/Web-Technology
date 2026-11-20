const express = require('express');
const mongoose = require('mongoose');
const { Student } = require('./models');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' });

// Whitelist fields and force types (blocks operator injection such as {"$ne": ...})
function pick(b) {
  b = b && typeof b === 'object' ? b : {};
  const s = (v) => (typeof v === 'string' ? v : undefined);
  const out = { name: s(b.name), email: s(b.email), course: s(b.course) };
  if (b.age !== undefined && b.age !== null && b.age !== '') out.age = Number(b.age);
  if (b.cgpa !== undefined && b.cgpa !== null && b.cgpa !== '') out.cgpa = Number(b.cgpa);
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

app.get('/', (req, res) =>
  res.json({
    name: 'Student CRUD API',
    endpoints: {
      'GET /api/students': 'list (?course=&minCgpa=&q=&sort=&page=)',
      'GET /api/students/:id': 'read one',
      'POST /api/students': 'create',
      'PUT /api/students/:id': 'update (name, email, course required)',
      'PATCH /api/students/:id': 'partial update',
      'DELETE /api/students/:id': 'delete',
    },
  }));
app.get('/health', (req, res) => res.send('ok'));

// READ (all) with filter / search / sort / pagination
app.get('/api/students', wrap(async (req, res) => {
  const { course, minCgpa, q, sort } = req.query;
  const filter = {};
  if (typeof course === 'string' && course) filter.course = course;
  if (typeof minCgpa === 'string' && minCgpa !== '' && !isNaN(minCgpa)) filter.cgpa = { $gte: Number(minCgpa) };
  if (typeof q === 'string' && q.trim()) filter.name = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const allowed = ['name', '-name', 'cgpa', '-cgpa', 'age', '-age', '-createdAt'];
  const sortKey = allowed.includes(sort) ? sort : '-createdAt';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const [items, total] = await Promise.all([
    Student.find(filter).sort(sortKey).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

// READ (one)
app.get('/api/students/:id', validId, wrap(async (req, res) => {
  const s = await Student.findById(req.params.id);
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
}));

// CREATE
app.post('/api/students', wrap(async (req, res) => {
  const s = await Student.create(pick(req.body));
  res.status(201).location(`/api/students/${s._id}`).json(s);
}));

// UPDATE: PUT requires name/email/course again, PATCH only the changed fields
app.put('/api/students/:id', validId, wrap(async (req, res) => {
  const b = pick(req.body);
  const missing = ['name', 'email', 'course'].filter((k) => !b[k] || !b[k].trim());
  if (missing.length) {
    return res.status(422).json({ error: 'Validation failed', errors: Object.fromEntries(missing.map((k) => [k, `${k} is required`])) });
  }
  const s = await Student.findByIdAndUpdate(req.params.id, { $set: b }, { new: true, runValidators: true });
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
}));

app.patch('/api/students/:id', validId, wrap(async (req, res) => {
  const s = await Student.findByIdAndUpdate(req.params.id, { $set: pick(req.body) }, { new: true, runValidators: true });
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
}));

// DELETE
app.delete('/api/students/:id', validId, wrap(async (req, res) => {
  const s = await Student.findByIdAndDelete(req.params.id);
  s ? res.json({ deleted: true, id: req.params.id }) : res.status(404).json({ error: 'Not found' });
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  if (err.name === 'ValidationError') {
    const errors = {};
    for (const [k, v] of Object.entries(err.errors)) errors[k] = v.message;
    return res.status(422).json({ error: 'Validation failed', errors });
  }
  if (err.name === 'CastError') return res.status(422).json({ error: 'Validation failed', errors: { [err.path]: 'Invalid value' } });
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate value', fields: Object.keys(err.keyPattern || {}) });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
