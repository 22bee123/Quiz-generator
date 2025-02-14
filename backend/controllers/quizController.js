import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizModel from '../model/quiz.model.js';
import { extractTextFromFile, cleanAndParseJSON, shuffleOptions } from '../utils/quiz.utils.js';
import fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

export const getQuizHistory = async (req, res) => {
    try {
        const quizzes = await QuizModel.find({ user: req.user.userId })
            .select('topic questions createdAt')
            .sort({ createdAt: -1 })
            .limit(10);
        
        console.log('Sending quiz history:', quizzes);
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: error.message });
    }
}; 