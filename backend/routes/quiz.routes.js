import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { 
    generateQuizFromText,
    generateQuizFromFile,
    getQuizHistory 
} from '../controllers/quizController.js';
import { generateQuizFromUrl } from '../controllers/videoQuizController.js';

const router = express.Router();

// Generate quiz from text input
router.post('/generate', authMiddleware, generateQuizFromText);

// Generate quiz from file
router.post('/generate-from-file', authMiddleware, upload.single('file'), generateQuizFromFile);

// Generate quiz from URL
router.post('/generate-from-url', authMiddleware, generateQuizFromUrl);

// Get quiz history
router.get('/history', authMiddleware, getQuizHistory);

export default router; 