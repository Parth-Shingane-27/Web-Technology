# Server-Side Validation with ExpressJS

Registration form validated entirely on the server using Express and `express-validator` (browser checks are off).

Live: https://express-validator-demo.onrender.com

## Run
    npm install
    npm start    # http://localhost:3000
    npm test

## Validation
- Name, email, username (unique), date of birth (age 18-120), optional URL, country, interests, strong password, password match, terms
- Invalid input returns HTTP 422 with per-field errors; the form keeps your input (never passwords)
- Also available as JSON: `POST /api/register`


