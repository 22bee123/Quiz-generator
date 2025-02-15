import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('profilePicture'), updateProfile);

export default router; 