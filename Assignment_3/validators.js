// Pure validation logic - no Express dependency, so it is easy to unit test.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/; // 10-digit Indian mobile number

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function validateRegistration(body = {}) {
  const errors = {};
  const data = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    age: clean(body.age),
    password: typeof body.password === 'string' ? body.password : '',
    confirmPassword: typeof body.confirmPassword === 'string' ? body.confirmPassword : '',
    terms: body.terms === 'on' || body.terms === 'true' || body.terms === true,
  };

  // Name
  if (!data.name) errors.name = 'Name is required.';
  else if (data.name.length < 3 || data.name.length > 50) errors.name = 'Name must be 3-50 characters.';
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(data.name)) errors.name = "Name may contain only letters, spaces, . ' and -.";

  // Email
  if (!data.email) errors.email = 'Email is required.';
  else if (data.email.length > 254 || !EMAIL_RE.test(data.email)) errors.email = 'Enter a valid email address.';

  // Phone
  if (!data.phone) errors.phone = 'Phone number is required.';
  else if (!PHONE_RE.test(data.phone)) errors.phone = 'Phone must be 10 digits starting with 6-9.';

  // Age
  if (!data.age) errors.age = 'Age is required.';
  else if (!/^\d+$/.test(data.age)) errors.age = 'Age must be a whole number.';
  else if (+data.age < 18 || +data.age > 100) errors.age = 'Age must be between 18 and 100.';

  // Password
  const pw = data.password;
  if (!pw) errors.password = 'Password is required.';
  else if (pw.length < 8 || pw.length > 64) errors.password = 'Password must be 8-64 characters.';
  else if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw))
    errors.password = 'Password needs an uppercase, a lowercase, a digit and a special character.';

  // Confirm password
  if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (data.confirmPassword !== pw) errors.confirmPassword = 'Passwords do not match.';

  // Terms
  if (!data.terms) errors.terms = 'You must accept the terms.';

  return { valid: Object.keys(errors).length === 0, errors, data };
}

module.exports = { validateRegistration };
