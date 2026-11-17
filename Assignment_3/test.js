const assert = require('assert');
const http = require('http');
const app = require('./server');

const good = { name: 'Parth Shingane', email: 'Parth@Example.com', phone: '9876543210', age: '21',
  password: 'Str0ng!Pass', confirmPassword: 'Str0ng!Pass', terms: 'on' };

const server = app.listen(0, async () => {
  const port = server.address().port;
  const post = (body) => new Promise((resolve) => {
    const data = JSON.stringify(body);
    const r = http.request({ port, path: '/api/register', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(b) })); });
    r.end(data);
  });
  try {
    let r = await post({});
    assert.equal(r.status, 422); assert.equal(Object.keys(r.json.errors).length, 7);
    r = await post({ ...good, email: 'bad' }); assert.equal(r.status, 422); assert.ok(r.json.errors.email);
    r = await post({ ...good, phone: '12345' }); assert.ok(r.json.errors.phone);
    r = await post({ ...good, age: '17' }); assert.ok(r.json.errors.age);
    r = await post({ ...good, password: 'weak', confirmPassword: 'weak' }); assert.ok(r.json.errors.password);
    r = await post({ ...good, confirmPassword: 'x' }); assert.ok(r.json.errors.confirmPassword);
    r = await post({ ...good, name: { $ne: 1 } }); assert.ok(r.json.errors.name); // non-string input rejected
    r = await post(good); assert.equal(r.status, 201);
    r = await post(good); assert.equal(r.status, 409);
    console.log('All tests passed');
  } catch (e) { console.error(e); process.exitCode = 1; }
  server.close();
});
