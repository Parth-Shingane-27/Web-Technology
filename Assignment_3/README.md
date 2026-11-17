# Server-Side Validation Demo (Node.js + Express)

A registration form whose rules (name, email, phone, age, password strength, confirm password, terms) are enforced **only on the server**. The form uses `novalidate`, so the server visibly rejects bad input, re-renders the form with per-field errors, keeps entered values (never passwords) and returns HTTP 422. A JSON endpoint reuses the same validator.

## Run
    npm install
    npm start        # http://localhost:3000
    npm test

## Bypass the browser entirely
    curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d "{}"

## Design
- `validators.js` - pure validation (trim/normalise, type checks, rules)
- `server.js` - routes, HTML escaping (XSS-safe), body size limit, 422/409/201 status codes
- `test.js` - API tests

## Deploy (Render)
1. Push to GitHub.
2. Render -> New Web Service -> pick the repo, root directory `Assignment_3` (`render.yaml` is detected).
3. Build `npm install`, start `npm start`. Also works on Railway/Heroku (uses `PORT`).
