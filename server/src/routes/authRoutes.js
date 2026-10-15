import express from 'express';
import { register, login, logout, getMe, verifyEmail, resendVerificationOtp } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema, verifyEmailSchema, resendOtpSchema } from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), resendVerificationOtp);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
