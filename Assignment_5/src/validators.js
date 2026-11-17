export const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Other'];
export const INTERESTS = ['Web', 'AI/ML', 'Mobile', 'Cloud', 'Security'];

export const passwordChecks = (p) => [
  { label: 'At least 8 characters', ok: p.length >= 8 },
  { label: 'Uppercase letter', ok: /[A-Z]/.test(p) },
  { label: 'Lowercase letter', ok: /[a-z]/.test(p) },
  { label: 'A number', ok: /\d/.test(p) },
  { label: 'A special character', ok: /[^A-Za-z0-9]/.test(p) },
];

export const passwordStrength = (p) => {
  const score = passwordChecks(p).filter((c) => c.ok).length;
  return { score, label: ['Too weak', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] };
};

const ageOf = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

// Each rule returns an error message, or '' when the value is valid.
export const rules = {
  name: (v) => {
    const s = v.trim();
    if (!s) return 'Full name is required';
    if (s.length < 3) return 'Name must be at least 3 characters';
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(s)) return "Use letters, spaces, . ' or - only";
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v.trim())) return 'Enter a valid email like name@example.com';
    return '';
  },
  username: (v) => {
    if (!v) return 'Username is required';
    if (/^\d/.test(v)) return 'Username cannot start with a number';
    if (!/^[A-Za-z0-9_]{4,15}$/.test(v)) return '4-15 characters: letters, numbers, underscore';
    return '';
  },
  phone: (v) => {
    if (!v) return 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(v)) return 'Enter a 10-digit mobile number starting with 6-9';
    return '';
  },
  dob: (v) => {
    if (!v) return 'Date of birth is required';
    if (new Date(v) > new Date()) return 'Date cannot be in the future';
    const a = ageOf(v);
    if (a < 18) return 'You must be at least 18 years old';
    if (a > 120) return 'Enter a realistic date of birth';
    return '';
  },
  country: (v) => (v ? '' : 'Please select a country'),
  interests: (v) => (v.length >= 2 ? '' : 'Pick at least 2 interests'),
  bio: (v) => (v.length > 200 ? 'Bio must be 200 characters or fewer' : ''),
  password: (v) => {
    if (!v) return 'Password is required';
    const missing = passwordChecks(v).find((c) => !c.ok);
    return missing ? `Password needs: ${missing.label.toLowerCase()}` : '';
  },
  confirm: (v, all) => {
    if (!v) return 'Please confirm your password';
    return v === all.password ? '' : 'Passwords do not match';
  },
  terms: (v) => (v ? '' : 'You must accept the terms'),
};

export const validateAll = (values) =>
  Object.fromEntries(Object.keys(rules).map((k) => [k, rules[k](values[k], values)]));
