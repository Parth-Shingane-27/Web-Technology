const express = require('express');
const path = require('path');
const { validateRegistration } = require('./validators');

const app = express();
const users = []; // in-memory store (demo only)

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderForm(values = {}, errors = {}, banner = '') {
  const field = (id, label, type, extra = '') => `
    <div class="field ${errors[id] ? 'invalid' : ''}">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" ${type === 'password' ? '' : `value="${esc(values[id])}"`} ${extra}>
      ${errors[id] ? `<p class="error">${esc(errors[id])}</p>` : ''}
    </div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Server-Side Validation Demo</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="card">
<h1>Registration</h1>
${banner}
<form method="POST" action="/register" novalidate>
${field('name', 'Full name', 'text', 'autocomplete="name"')}
${field('email', 'Email', 'text', 'autocomplete="email"')}
${field('phone', 'Phone (10 digits)', 'text', 'inputmode="numeric"')}
${field('age', 'Age', 'text', 'inputmode="numeric"')}
${field('password', 'Password', 'password', 'autocomplete="new-password"')}
${field('confirmPassword', 'Confirm password', 'password', 'autocomplete="new-password"')}
<div class="field ${errors.terms ? 'invalid' : ''}">
  <label class="check"><input type="checkbox" name="terms" ${values.terms ? 'checked' : ''}> I accept the terms</label>
  ${errors.terms ? `<p class="error">${esc(errors.terms)}</p>` : ''}
</div>
<button type="submit">Register</button>
</form>
<p class="sub"><a href="/users">View registered users</a></p>
</main></body></html>`;
}

function addUser(data) {
  users.push({ name: data.name, email: data.email, phone: data.phone, age: +data.age, createdAt: new Date().toISOString() });
}

app.get('/', (req, res) => res.send(renderForm()));

// HTML form submission: re-render the form with errors + preserved input (HTTP 422)
app.post('/register', (req, res) => {
  const { valid, errors, data } = validateRegistration(req.body);
  if (!valid)
    return res.status(422).send(renderForm(data, errors, `<div class="banner bad">Please fix ${Object.keys(errors).length} error(s) below.</div>`));
  if (users.some((u) => u.email === data.email))
    return res.status(409).send(renderForm(data, { email: 'This email is already registered.' }, '<div class="banner bad">Registration failed.</div>'));
  addUser(data);
  res.status(201).send(renderForm({}, {}, `<div class="banner ok">Welcome, ${esc(data.name)}! Registration successful.</div>`));
});

// JSON API: same validator, machine-readable errors
app.post('/api/register', (req, res) => {
  const { valid, errors, data } = validateRegistration(req.body);
  if (!valid) return res.status(422).json({ success: false, errors });
  if (users.some((u) => u.email === data.email))
    return res.status(409).json({ success: false, errors: { email: 'This email is already registered.' } });
  addUser(data);
  res.status(201).json({ success: true, message: 'Registered', user: { name: data.name, email: data.email } });
});

app.get('/users', (req, res) => {
  const rows = users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${u.age}</td></tr>`).join('');
  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Users</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="card"><h1>Registered users (${users.length})</h1>
<table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Age</th></tr>${rows || '<tr><td colspan="4">None yet</td></tr>'}</table>
<p class="sub"><a href="/">Back</a></p></main></body></html>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).send('Not found'));
app.use((err, req, res, next) =>
  res.status(err.status || 500).json({ success: false, error: err.status === 413 ? 'Payload too large' : 'Bad request' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}
module.exports = app;
