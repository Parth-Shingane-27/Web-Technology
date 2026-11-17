# Client-Side Validation with ReactJS

Registration form validated entirely in the browser with React (no validation library; native browser checks are off via `noValidate`).

## Run
    npm install
    npm run dev      # http://localhost:5173
    npm run build    # outputs dist/

## Features
- Live validation: errors appear once a field is blurred, then update on every keystroke
- Rules for name, email, username, 10-digit mobile, age 18+, country, 2+ interests, bio length, terms
- Password strength meter + checklist, show/hide toggle, confirm-password match
- Form-completion progress bar, per-field valid/invalid styling, error count
- Submit is blocked until every field is valid; the first invalid field is focused
- Validation rules live in `src/validators.js`

## Deploy
Static site: `render.yaml` is set up for Render (build `npm install && npm run build`, publish `dist`).
