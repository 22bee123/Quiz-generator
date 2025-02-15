import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizModel from '../model/quiz.model.js';
import { extractTextFromFile, cleanAndParseJSON, shuffleOptions } from '../utils/quiz.utils.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Initialize the API with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuizFromText = async (req, res) => {
    try {
        const { topic, numberOfQuestions = 5 } = req.body;
        
        // Verify API key is present
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key is not configured');
        }

        // Initialize Gemini Pro
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create prompt for quiz generation
        const prompt = `Generate a quiz about ${topic} with ${numberOfQuestions} multiple choice questions. 
        Format the response as a JSON object with this structure:
        {
            "questions": [
                {
                    "question": "question text",
                    "options": {
                        "A": "first option",
                        "B": "second option",
                        "C": "third option",
                        "D": "fourth option"
                    },
                    "correctAnswer": "A"
                }
            ]
        }`;

        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse and clean the generated JSON
        const parsedQuiz = await cleanAndParseJSON(text);
        
        if (!parsedQuiz || !parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
            throw new Error('Invalid quiz format received from AI');
        }

        // Shuffle options for each question
        const shuffledQuestions = parsedQuiz.questions.map(q => {
            if (!q || typeof q !== 'object') {
                throw new Error('Invalid question format');
            }
            return shuffleOptions(q);
        });

        // Create new quiz document
        const newQuiz = new QuizModel({
            topic,
            questions: shuffledQuestions,
            user: req.user.userId
        });

        // Save to database
        const savedQuiz = await newQuiz.save();
        
        res.json(savedQuiz);
    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ 
            error: 'Failed to generate quiz', 
            details: error.message 
        });
    }
};

export const generateQuizFromFile = async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        filePath = req.file.path;

        const numberOfQuestions = parseInt(req.body.numberOfQuestions) || 5;
        const fileContent = await extractTextFromFile(filePath, req.file.mimetype);
        
        if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('No content could be extracted from the file');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Based on this content, generate ${numberOfQuestions} multiple choice questions:
            ${fileContent.substring(0, 15000)}
            
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
        const parsedData = cleanAndParseJSON(response.text());
        
        parsedData.questions = parsedData.questions.map(shuffleOptions);

        const newQuiz = new QuizModel({
            topic: req.file.originalname,
            questions: parsedData.questions,
            user: req.user.userId
        });

        const savedQuiz = await newQuiz.save();
        await fs.unlink(filePath);
        res.json(savedQuiz);

    } catch (error) {
        console.error('Error processing file:', error);
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        res.status(500).json({ error: 'Failed to process file', message: error.message });
    }
};

export const generateQuizFromUrl = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Extract video ID from YouTube URL
        const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Use YouTube API or a scraping service to get video transcript/captions
        // For now, we'll use a placeholder text
        const text = `This is a video about ${videoId}. Please provide proper video transcript here.`;

        // Generate quiz using AI
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate a quiz based on this text: "${text}"

IMPORTANT: Your response must be ONLY valid JSON with NO additional text or formatting.
Generate exactly 5 multiple choice questions.

Each question must have these exact fields:
- "question": A clear, concise question
- "options": An array of EXACTLY 4 strings with possible answers
- "correctAnswer": One of the options that is the correct answer

Example response format:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correctAnswer": "Paris"
  }
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // Log the response for debugging
        console.log('AI Response:', responseText);
        
        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }
        
        const quizData = JSON.parse(jsonMatch[0]);
        
        if (!Array.isArray(quizData) || quizData.length === 0) {
            throw new Error('Invalid quiz format - expected non-empty array');
        }

        // Validate each question
        quizData.forEach((q, i) => {
            if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
                throw new Error(`Invalid question format at index ${i}`);
            }
            if (q.options.length !== 4) {
                throw new Error(`Question ${i + 1} must have exactly 4 options`);
            }
            if (!q.options.includes(q.correctAnswer)) {
                throw new Error(`Question ${i + 1}'s correct answer must be one of the options`);
            }
        });

        // Create and save the quiz
        const newQuiz = new QuizModel({
            user: req.user.userId,
            topic: `YouTube Video: ${videoId}`,
            questions: quizData.map(q => shuffleOptions(q))
        });

        const savedQuiz = await newQuiz.save();
        res.json(savedQuiz);
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ error: 'Failed to process video', details: error.message });
    }
};

export const getQuizHistory = async (req, res) => {
    try {
        const quizzes = await QuizModel.find({ user: req.user.userId })
            .select('topic questions createdAt')
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: error.message });
    }
}; 