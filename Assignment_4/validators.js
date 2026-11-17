const { body } = require('express-validator');

const COUNTRIES = ['India', 'USA', 'UK', 'Germany', 'Japan', 'Other'];
const INTERESTS = ['web', 'ai', 'security', 'cloud'];

// Each chain: sanitize first (trim/normalize), then validate. Messages are returned per field.
const registrationRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.').bail()
    .isLength({ min: 2, max: 60 }).withMessage('Full name must be 2-60 characters.')
    .matches(/^[\p{L}][\p{L} .'-]*$/u).withMessage("Full name may contain only letters, spaces, . ' and -."),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.').bail()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.').bail()
    .matches(/^[a-zA-Z][a-zA-Z0-9_]{3,15}$/).withMessage('Username: 4-16 chars, start with a letter, only letters/digits/underscore.').bail()
    .custom((v, { req }) => !(req.app.locals.store || []).some((u) => u.username.toLowerCase() === v.toLowerCase()))
    .withMessage('This username is already taken.'),

  body('dob')
    .trim()
    .notEmpty().withMessage('Date of birth is required.').bail()
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Date of birth must be a valid date (YYYY-MM-DD).').bail()
    .custom((v) => new Date(v) <= new Date()).withMessage('Date of birth cannot be in the future.').bail()
    .custom((v) => {
      const d = new Date(v), n = new Date();
      let age = n.getFullYear() - d.getFullYear();
      if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) age--;
      return age >= 18 && age <= 120;
    }).withMessage('You must be between 18 and 120 years old.'),

  body('website')
    .trim()
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Website must be a valid http(s) URL.'),

  body('country')
    .trim()
    .isIn(COUNTRIES).withMessage('Choose a country from the list.'),

  body('interests')
    .customSanitizer((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]))
    .custom((arr) => arr.length >= 1 && arr.length <= 4 && arr.every((i) => INTERESTS.includes(i)))
    .withMessage('Select 1-4 valid interests.'),

  body('password')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters.')
    .matches(/[a-z]/).withMessage('Password needs a lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter.')
    .matches(/\d/).withMessage('Password needs a digit.')
    .matches(/[^\w\s]/).withMessage('Password needs a special character.'),

  body('confirmPassword')
    .custom((v, { req }) => v === req.body.password).withMessage('Passwords do not match.'),

  body('terms')
    .custom((v) => v === 'on' || v === 'true' || v === true).withMessage('You must accept the terms.'),
];

module.exports = { registrationRules, COUNTRIES, INTERESTS };
