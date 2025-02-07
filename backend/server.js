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

// CORS and middleware setup
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

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
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
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
    const correctOption = options[0];
    
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    const shuffledOptions = {};
    const optionKeys = ['A', 'B', 'C', 'D'];
    let newCorrectAnswer = '';
    
    options.forEach((option, index) => {
        shuffledOptions[optionKeys[index]] = option[1];
        if (option === correctOption) {
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

// Generate quiz from topic
app.post('/api/generate-quiz', async (req, res) => {
    const { topic, numberOfQuestions } = req.body;
    
    if (!topic || !numberOfQuestions) {
        return res.status(400).json({ error: 'Topic and number of questions are required' });
    }
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate an educational multiple choice quiz with ${numberOfQuestions} questions about ${topic}.
            Return only a JSON object with this structure:
            {
              "questions": [
                {
                  "question": "Write an educational question about ${topic}",
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
        
        // Validate and shuffle questions
        if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid questions array structure');
        }

        parsedData.questions = parsedData.questions.map(shuffleOptions);

        const newQuiz = new QuizModel({
            topic,
            questions: parsedData.questions
        });

        const savedQuiz = await newQuiz.save();
        res.json(savedQuiz);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
});

// Generate quiz from file
app.post('/api/generate-quiz-from-file', upload.single('file'), async (req, res) => {
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

        const newQuiz = new QuizModel({
            topic: req.file.originalname,
            questions: parsedData.questions
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

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
    try {
        const quizzes = await QuizModel.find().sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));