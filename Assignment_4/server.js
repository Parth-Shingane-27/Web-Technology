const express = require('express');
const path = require('path');
const { validationResult, matchedData } = require('express-validator');
const { registrationRules, COUNTRIES, INTERESTS } = require('./validators');

const app = express();
app.locals.store = []; // in-memory (demo only)

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Collapse express-validator results to { field: firstMessage }
function collectErrors(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return null;
  const errors = {};
  for (const e of result.array()) if (!errors[e.path]) errors[e.path] = e.msg;
  return errors;
}

// Values we may safely echo back after a rejection (never passwords)
function echo(req) {
  const b = req.body || {};
  const s = (k) => (typeof b[k] === 'string' ? b[k] : '');
  return {
    fullName: s('fullName'), email: s('email'), username: s('username'), dob: s('dob'), website: s('website'),
    country: s('country'), interests: [].concat(b.interests || []).map(String), terms: !!b.terms,
  };
}

function renderPage(v = {}, errors = {}, banner = '') {
  const input = (id, label, type, extra = '') => `
    <div class="field ${errors[id] ? 'invalid' : ''}">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" ${type === 'password' ? '' : `value="${esc(v[id])}"`} ${extra}>
      ${errors[id] ? `<p class="error">${esc(errors[id])}</p>` : ''}
    </div>`;
  const countries = COUNTRIES.map((c) => `<option ${v.country === c ? 'selected' : ''}>${c}</option>`).join('');
  const interests = INTERESTS.map(
    (i) => `<label class="check"><input type="checkbox" name="interests" value="${i}" ${(v.interests || []).includes(i) ? 'checked' : ''}> ${i}</label>`
  ).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Server-Side Validation with ExpressJS</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="card">
<h1>Create account</h1>
${banner}
<form method="POST" action="/register" novalidate>
${input('fullName', 'Full name', 'text', 'autocomplete="name"')}
${input('email', 'Email', 'text', 'autocomplete="email"')}
${input('username', 'Username', 'text', 'autocomplete="username"')}
${input('dob', 'Date of birth', 'date')}
${input('website', 'Website (optional)', 'text', 'placeholder="https://"')}
<div class="field ${errors.country ? 'invalid' : ''}">
  <label for="country">Country</label>
  <select id="country" name="country"><option value="">-- choose --</option>${countries}</select>
  ${errors.country ? `<p class="error">${esc(errors.country)}</p>` : ''}
</div>
<div class="field ${errors.interests ? 'invalid' : ''}">
  <label>Interests</label><div class="checks">${interests}</div>
  ${errors.interests ? `<p class="error">${esc(errors.interests)}</p>` : ''}
</div>
${input('password', 'Password', 'password', 'autocomplete="new-password"')}
${input('confirmPassword', 'Confirm password', 'password', 'autocomplete="new-password"')}
<div class="field ${errors.terms ? 'invalid' : ''}">
  <label class="check"><input type="checkbox" name="terms" ${v.terms ? 'checked' : ''}> I accept the terms</label>
  ${errors.terms ? `<p class="error">${esc(errors.terms)}</p>` : ''}
</div>
<button type="submit">Register</button>
</form>
<p class="sub"><a href="/users">Registered users</a></p>
</main></body></html>`;
}

app.get('/', (req, res) => res.send(renderPage()));

// HTML form: re-render with errors + preserved input (422)
app.post('/register', registrationRules, (req, res) => {
  const errors = collectErrors(req);
  if (errors)
    return res.status(422).send(renderPage(echo(req), errors, `<div class="banner bad">Please fix ${Object.keys(errors).length} error(s) below.</div>`));
  const d = matchedData(req);
  app.locals.store.push({ fullName: d.fullName, email: d.email, username: d.username, dob: d.dob, website: d.website || null,
    country: d.country, interests: d.interests, createdAt: new Date().toISOString() });
  res.status(201).send(renderPage({}, {}, `<div class="banner ok">Welcome, ${esc(d.fullName)}! Registration successful.</div>`));
});

// JSON API: 422 { success:false, errors:{field:msg} } or 201 { success:true, user }
app.post('/api/register', registrationRules, (req, res) => {
  const errors = collectErrors(req);
  if (errors) return res.status(422).json({ success: false, errors });
  const d = matchedData(req);
  const user = { fullName: d.fullName, email: d.email, username: d.username, dob: d.dob, website: d.website || null,
    country: d.country, interests: d.interests, createdAt: new Date().toISOString() };
  app.locals.store.push(user);
  res.status(201).json({ success: true, user });
});

app.get('/api/users', (req, res) => res.json(app.locals.store));

app.get('/users', (req, res) => {
  const rows = app.locals.store.map((u) =>
    `<tr><td>${esc(u.fullName)}</td><td>${esc(u.username)}</td><td>${esc(u.email)}</td><td>${esc(u.country)}</td></tr>`).join('');
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Users</title><link rel="stylesheet" href="/style.css"></head><body><main class="card"><h1>Registered users</h1>
${rows ? `<table><tr><th>Name</th><th>Username</th><th>Email</th><th>Country</th></tr>${rows}</table>` : '<p class="sub">No users yet.</p>'}
<p class="sub"><a href="/">&larr; Back</a></p></main></body></html>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Malformed JSON / oversized body -> clean JSON error, not a stack trace
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, error: status === 500 ? 'Internal server error' : err.message });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}
module.exports = app;
