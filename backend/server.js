import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

import QuizDatabase from './db/Quiz.Database.js';
import QuizModel from './model/quiz.model.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Initialize database connection
QuizDatabase();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate quiz questions and save to database
app.post('/api/generate-quiz', async (req, res) => {
    const { topic, numberOfQuestions } = req.body;
    
    if (!topic || !numberOfQuestions) {
        return res.status(400).json({ error: 'Topic and number of questions are required' });
    }
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE",
                },
            ],
        });

        const prompt = `Generate an educational multiple choice quiz with ${numberOfQuestions} questions about ${topic}.
            The content should be appropriate for general audiences and educational purposes.
            Return only a JSON object in this exact format, without any additional text or markdown:
            {
              "questions": [
                {
                  "question": "Write an educational question about ${topic}",
                  "options": {
                    "A": "First option",
                    "B": "Second option",
                    "C": "Third option",
                    "D": "Fourth option"
                  },
                  "correctAnswer": "A"
                }
              ]
            }`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        });

        const response = await result.response;
        let content = response.text();

        // Remove any markdown formatting and clean the response
        content = content.replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .replace(/^\s*\{\s*/, '{') // Clean up starting whitespace
                        .replace(/\s*\}\s*$/, '}') // Clean up ending whitespace
                        .trim();

        let parsedData;
        try {
            parsedData = JSON.parse(content);
            
            // Validate the structure of each question
            if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
                throw new Error('Invalid questions array structure');
            }

            parsedData.questions.forEach((question, index) => {
                if (!question.question || !question.options || !question.correctAnswer) {
                    throw new Error(`Question ${index + 1} is missing required fields`);
                }
                if (!question.options.A || !question.options.B || !question.options.C || !question.options.D) {
                    throw new Error(`Question ${index + 1} is missing one or more options`);
                }
            });

        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Raw content received:', content);
            return res.status(500).json({ 
                error: 'Failed to parse AI response', 
                details: parseError.message,
                rawContent: content // This helps with debugging
            });
        }

        // Create and save the quiz
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
            message: error.message,
            details: error.response?.data || 'No additional details available'
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