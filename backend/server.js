import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QuizDatabase from './db/Quiz.Database.js';
import QuizModel from './model/quiz.model.js';
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import authRoutes from './routes/auth.routes.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import quizRoutes from './routes/quiz.routes.js';
import ytdl from 'ytdl-core';
import { getSubtitles } from 'youtube-captions-scraper';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
try {
    await fs.access(uploadsDir);
} catch {
    await fs.mkdir(uploadsDir);
}

// More flexible CORS configuration for development
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        // Allow localhost on any port
        if(origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
QuizDatabase();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Helper function to shuffle options
function shuffleOptions(question) {
    const options = Object.entries(question.options);
    const correctAnswer = question.correctAnswer;
    const correctOptionValue = question.options[correctAnswer];
    
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    const shuffledOptions = {};
    const optionKeys = ['A', 'B', 'C', 'D'];
    let newCorrectAnswer = '';
    
    options.forEach((option, index) => {
        shuffledOptions[optionKeys[index]] = option[1];
        if (option[1] === correctOptionValue) {
            newCorrectAnswer = optionKeys[index];
        }
    });
    
    return {
        question: question.question,
        options: shuffledOptions,
        correctAnswer: newCorrectAnswer
    };
}

// Helper function to extract text from files
async function extractTextFromFile(filePath, mimeType) {
    try {
        switch (mimeType) {
            case 'application/pdf':
                return new Promise((resolve, reject) => {
                    const pdfParser = new PDFParser();
                    
                    pdfParser.on("pdfParser_dataReady", pdfData => {
                        try {
                            const text = pdfParser.getRawTextContent();
                            resolve(text);
                        } catch (error) {
                            reject(new Error('Failed to parse PDF content'));
                        }
                    });

                    pdfParser.on("pdfParser_dataError", errData => {
                        reject(new Error('Failed to parse PDF file'));
                    });

                    pdfParser.loadPDF(filePath);
                });

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                const docxBuffer = await fs.readFile(filePath);
                const result = await mammoth.extractRawText({ buffer: docxBuffer });
                return result.value;

            case 'text/plain':
                return await fs.readFile(filePath, 'utf8');

            default:
                throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error(`Failed to extract text from file: ${error.message}`);
    }
}

// Add this helper function at the top of the file
const cleanAndParseJSON = (content) => {
    try {
        // Remove any markdown code block syntax
        content = content.replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .trim();
        
        // Try to find the JSON object
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No valid JSON found in response');
        }
        
        // Extract just the JSON part
        content = content.slice(jsonStart, jsonEnd + 1);
        
        // Parse and validate the structure
        const parsed = JSON.parse(content);
        
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid quiz format');
        }
        
        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse quiz data: ${error.message}`);
    }
};

// Update the quiz generation route
app.post('/api/generate-quiz', authMiddleware, async (req, res) => {
    try {
        const { topic, numberOfQuestions } = req.body;
        const userId = req.user.userId;

        if (!topic || !numberOfQuestions) {
            return res.status(400).json({ error: 'Topic and number of questions are required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate an educational multiple choice quiz with exactly ${numberOfQuestions} questions about ${topic}.
            Format the response as a JSON object with this exact structure:
            {
              "questions": [
                {
                  "question": "Question text here",
                  "options": {
                    "A": "Correct answer",
                    "B": "Wrong answer",
                    "C": "Wrong answer",
                    "D": "Wrong answer"
                  },
                  "correctAnswer": "A"
                }
              ]
            }
            Ensure the JSON is properly formatted with no trailing commas.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        // Clean and parse the response
        const parsedData = cleanAndParseJSON(content);

        // Validate questions
        if (!parsedData.questions || parsedData.questions.length === 0) {
            throw new Error('No questions generated');
        }

        // Create and save the quiz
        const newQuiz = new QuizModel({
            topic: req.body.topic,
            questions: parsedData.questions.map(shuffleOptions),
            user: req.user.userId
        });

        const savedQuiz = await newQuiz.save();
        res.json(savedQuiz);

    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate quiz', 
            details: error.message 
        });
    }
});

// Add back the file upload route
app.post('/api/generate-quiz-from-file', authMiddleware, upload.single('file'), async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        filePath = req.file.path;

        const numberOfQuestions = parseInt(req.body.numberOfQuestions) || 5;
        
        // Extract text from the uploaded file
        const fileContent = await extractTextFromFile(filePath, req.file.mimetype);
        
        if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('No content could be extracted from the file');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Based on this content, generate ${numberOfQuestions} multiple choice questions:
            ${fileContent.substring(0, 15000)} // Limit content length to avoid token limits
            
            Return only a JSON object with this structure:
            {
              "questions": [
                {
                  "question": "Question based on the content",
                  "options": {
                    "A": "Correct answer",
                    "B": "Incorrect option",
                    "C": "Incorrect option",
                    "D": "Incorrect option"
                  },
                  "correctAnswer": "A"
                }
              ]
            }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let content = response.text();

        // Clean the response
        content = content.replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .trim();

        let parsedData = JSON.parse(content);
        
        if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid questions array structure');
        }

        parsedData.questions = parsedData.questions.map(shuffleOptions);

        const userId = req.user.userId;
        
        const newQuiz = new QuizModel({
            topic: req.file.originalname,
            questions: parsedData.questions,
            user: userId
        });

        const savedQuiz = await newQuiz.save();
        
        // Clean up uploaded file
        await fs.unlink(filePath);
        
        res.json(savedQuiz);

    } catch (error) {
        console.error('Error processing file:', error);
        // Clean up file if it exists
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        res.status(500).json({ 
            error: 'Failed to process file', 
            message: error.message 
        });
    }
});

// Update the generate-quiz-from-url route
app.post('/api/generate-quiz-from-url', authMiddleware, async (req, res) => {
    try {
        const { url, numberOfQuestions } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        let videoText = '';
        let videoTitle = '';

        // Handle YouTube videos
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = ytdl.getVideoID(url);
            
            try {
                // Get video info
                const videoInfo = await ytdl.getBasicInfo(url);
                videoTitle = videoInfo.videoDetails.title;

                // Get video captions/subtitles
                const captions = await getSubtitles({
                    videoID: videoId,
                    lang: 'en' // default to English
                });

                videoText = captions.map(caption => caption.text).join(' ');
            } catch (error) {
                console.error('Error getting video data:', error);
                throw new Error('Could not process video data');
            }
        }
        // Add support for other platforms as needed

        if (!videoText) {
            throw new Error('No text content could be extracted from the video');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Based on this video content, generate ${numberOfQuestions} multiple choice questions:
            ${videoText.substring(0, 15000)} // Limit content length
            
            Return only a JSON object with this structure:
            {
              "questions": [
                {
                  "question": "Question based on the video",
                  "options": {
                    "A": "Correct answer",
                    "B": "Incorrect option",
                    "C": "Incorrect option",
                    "D": "Incorrect option"
                  },
                  "correctAnswer": "A"
                }
              ]
            }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        // Clean and parse the response
        const parsedData = cleanAndParseJSON(content);

        // Create and save the quiz with video title
        const newQuiz = new QuizModel({
            topic: videoTitle || 'Video Quiz',
            questions: parsedData.questions.map(shuffleOptions),
            user: req.user.userId
        });

        const savedQuiz = await newQuiz.save();
        res.json(savedQuiz);

    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ 
            error: 'Failed to process video', 
            details: error.message 
        });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Add the auth routes
app.use('/api/auth', authRoutes);

// Update the quiz history route to include more details
app.get('/api/quizzes', authMiddleware, async (req, res) => {
    try {
        const quizzes = await QuizModel.find({ user: req.user.userId })
            .select('topic questions createdAt') // Select only needed fields
            .sort({ createdAt: -1 })
            .limit(10); // Limit to most recent 10 quizzes
        
        console.log('Sending quiz history:', quizzes); // Debug log
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add quiz routes
app.use('/api/quiz', quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));