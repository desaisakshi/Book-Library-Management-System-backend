const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyOTP.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/resend-otp', authController.resendOTP.bind(authController));

// Dev-only SMTP test
router.get('/test-email', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') return res.status(403).json({ success: false, message: 'Dev only' });
  const { sendEmail } = require('../utils/emailService');
  const to = req.query.to || process.env.SMTP_USER;
  const r = await sendEmail(to, 'SMTP Test', '<h2>✅ SMTP working!</h2>');
  res.json({ success: r.success, message: r.success ? `Sent to ${to}` : r.error });
});

module.exports = router;
