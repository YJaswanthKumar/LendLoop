const { body } = require('express-validator');

const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 20 }).withMessage('Phone is invalid'),
  body('city').optional({ nullable: true }).isString(),
  body('state').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString(),
  body('latitude').optional({ nullable: true }).isFloat().withMessage('Latitude must be a number'),
  body('longitude').optional({ nullable: true }).isFloat().withMessage('Longitude must be a number'),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
