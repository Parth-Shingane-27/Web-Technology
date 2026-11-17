const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const good = () => ({
  fullName: 'Asha Patil', email: 'Asha@Example.com', username: 'asha_p', dob: '2000-05-10', website: 'https://asha.dev',
  country: 'India', interests: ['web', 'ai'], password: 'Str0ng!Pass', confirmPassword: 'Str0ng!Pass', terms: 'on',
});
const post = (body) => fetch(`${base}/api/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('valid payload -> 201 and sanitized email', async () => {
  const r = await post(good());
  assert.strictEqual(r.status, 201);
  assert.strictEqual((await r.json()).user.email, 'asha@example.com');
});

test('duplicate username (case-insensitive) -> 422', async () => {
  const r = await post({ ...good(), username: 'ASHA_P' });
  assert.strictEqual(r.status, 422);
  assert.ok((await r.json()).errors.username);
});

test('empty body reports every required field', async () => {
  const r = await post({});
  assert.strictEqual(r.status, 422);
  const { errors } = await r.json();
  for (const f of ['fullName', 'email', 'username', 'dob', 'country', 'interests', 'password', 'terms']) assert.ok(errors[f], f);
});

for (const [name, patch, field] of [
  ['bad email', { email: 'nope', username: 'u_one' }, 'email'],
  ['weak password', { password: 'abc', confirmPassword: 'abc', username: 'u_two' }, 'password'],
  ['password mismatch', { confirmPassword: 'Different1!', username: 'u_three' }, 'confirmPassword'],
  ['under 18', { dob: '2020-01-01', username: 'u_four' }, 'dob'],
  ['impossible date', { dob: '2000-02-31', username: 'u_five' }, 'dob'],
  ['non-http URL', { website: 'javascript:alert(1)', username: 'u_six' }, 'website'],
  ['country not in allowlist', { country: 'Mars', username: 'u_seven' }, 'country'],
  ['unknown interest', { interests: ['hacking'], username: 'u_eight' }, 'interests'],
  ['terms unchecked', { terms: undefined, username: 'u_nine' }, 'terms'],
]) test(`rejects ${name}`, async () => {
  const r = await post({ ...good(), ...patch });
  assert.strictEqual(r.status, 422);
  assert.ok((await r.json()).errors[field]);
});

test('form re-render escapes input and never echoes password', async () => {
  const r = await fetch(`${base}/register`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ fullName: '<script>x</script>', password: 'SECRETVALUE' }) });
  const html = await r.text();
  assert.strictEqual(r.status, 422);
  assert.ok(!html.includes('<script>x') && html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('SECRETVALUE'));
});

test('malformed JSON -> 400 JSON error', async () => {
  const r = await fetch(`${base}/api/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.strictEqual(r.status, 400);
});
