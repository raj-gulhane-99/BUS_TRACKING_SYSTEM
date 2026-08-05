const express = require('express');
const { body }  = require('express-validator');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { login, getMe, changePassword, forgotPassword } = require('../controllers/authController');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], login);

router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);
router.post('/forgot-password', forgotPassword);

module.exports = router;
