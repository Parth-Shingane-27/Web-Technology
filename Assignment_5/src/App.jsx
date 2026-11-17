import { useState, useMemo } from 'react';
import { COUNTRIES, INTERESTS, rules, validateAll, passwordStrength } from './validators.js';

const initial = {
  name: '', email: '', username: '', phone: '', dob: '', country: '',
  interests: [], bio: '', password: '', confirm: '', terms: false,
};

function Field({ label, error, touched, hint, children, required = true }) {
  const state = touched ? (error ? 'invalid' : 'valid') : '';
  return (
    <div className={`field ${state}`}>
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {touched && error ? <p className="msg err" role="alert">✕ {error}</p>
        : !touched && hint ? <p className="msg hint">{hint}</p> : null}
    </div>
  );
}

export default function App() {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const errors = useMemo(() => validateAll(values), [values]);
  const errorCount = Object.values(errors).filter(Boolean).length;
  const fields = Object.keys(rules);
  // optional fields (empty bio is valid) don't count towards completion
  const required = fields.filter((k) => k !== 'bio');
  const progress = Math.round((required.filter((k) => !errors[k]).length / required.length) * 100);
  const strength = passwordStrength(values.password);

  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));
  const bind = (k) => ({
    id: k, name: k, value: values[k],
    onChange: (e) => set(k, e.target.value),
    onBlur: () => touch(k),
    'aria-invalid': !!(touched[k] && errors[k]),
  });
  const f = (k, extra = {}) => ({ error: errors[k], touched: touched[k], ...extra });

  const toggleInterest = (i) => {
    set('interests', values.interests.includes(i) ? values.interests.filter((x) => x !== i) : [...values.interests, i]);
    touch('interests');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fields.map((k) => [k, true])));
    if (errorCount === 0) {
      const { password, confirm, terms, ...safe } = values;
      setSubmitted(safe);
    } else {
      // wait for React to render the invalid state before looking for the first bad field
      setTimeout(() => document.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea')?.focus(), 0);
    }
  };

  const reset = () => { setValues(initial); setTouched({}); setSubmitted(null); };

  if (submitted) {
    return (
      <main className="card success">
        <div className="tick">✓</div>
        <h1>Registration successful</h1>
        <p className="sub">All fields passed client-side validation.</p>
        <dl>
          {Object.entries(submitted).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{(Array.isArray(v) ? v.join(', ') : String(v)) || '—'}</dd></div>
          ))}
        </dl>
        <button className="btn" onClick={reset}>Register another</button>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Create account</h1>

      <div className="progress" aria-label="Form completion">
        <div style={{ width: `${progress}%` }} />
        <span>{progress}% valid</span>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="grid">
          <Field {...f('name', { label: 'Full name' })}>
            <input {...bind('name')} placeholder="Parth Shingane" autoComplete="name" />
          </Field>
          <Field {...f('email', { label: 'Email' })}>
            <input {...bind('email')} type="email" placeholder="name@example.com" autoComplete="email" />
          </Field>
          <Field {...f('username', { label: 'Username', hint: '4-15 chars, letters/numbers/underscore' })}>
            <input {...bind('username')} autoComplete="username" />
          </Field>
          <Field {...f('phone', { label: 'Mobile number' })}>
            <input
              {...bind('phone')} inputMode="numeric" maxLength={10} placeholder="9876543210"
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Field {...f('dob', { label: 'Date of birth' })}>
            <input {...bind('dob')} type="date" max={new Date().toISOString().split('T')[0]} />
          </Field>
          <Field {...f('country', { label: 'Country' })}>
            <select {...bind('country')}>
              <option value="">Select…</option>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field {...f('interests', { label: 'Interests' })}>
          <div className="chips">
            {INTERESTS.map((i) => (
              <label key={i} className={`chip ${values.interests.includes(i) ? 'on' : ''}`}>
                <input type="checkbox" checked={values.interests.includes(i)} onChange={() => toggleInterest(i)} />
                {i}
              </label>
            ))}
          </div>
        </Field>

        <Field {...f('bio', { label: 'Short bio', required: false, hint: 'Optional' })}>
          <textarea {...bind('bio')} rows={3} />
          <span className={`count ${values.bio.length > 200 ? 'over' : ''}`}>{values.bio.length}/200</span>
        </Field>

        <div className="grid">
          <Field {...f('password', { label: 'Password' })}>
            <div className="pw">
              <input {...bind('password')} type={showPw ? 'text' : 'password'} autoComplete="new-password" />
              <button type="button" className="link" onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
          </Field>
          <Field {...f('confirm', { label: 'Confirm password' })}>
            <input {...bind('confirm')} type={showPw ? 'text' : 'password'} autoComplete="new-password" />
          </Field>
        </div>

        {values.password && (
          <div className="strength">
            <div className={`bar s${strength.score}`}><div style={{ width: `${strength.score * 20}%` }} /></div>
            <strong>{strength.label}</strong>
          </div>
        )}

        <Field {...f('terms', { label: '' })}>
          <label className="terms">
            <input type="checkbox" checked={values.terms}
              onChange={(e) => { set('terms', e.target.checked); touch('terms'); }} />
            I accept the terms and conditions <span className="req">*</span>
          </label>
        </Field>

        <div className="actions">
          <button className="btn" type="submit">Register</button>
          <button className="btn ghost" type="button" onClick={reset}>Reset</button>
          {errorCount > 0 && <span className="left">{errorCount} field{errorCount > 1 ? 's need' : ' needs'} attention</span>}
        </div>
      </form>
    </main>
  );
}
