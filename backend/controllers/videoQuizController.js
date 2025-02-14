import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizModel from '../model/quiz.model.js';
import ytdl from 'ytdl-core';
import { getSubtitles } from 'youtube-captions-scraper';
import { cleanAndParseJSON, shuffleOptions } from '../utils/quiz.utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuizFromUrl = async (req, res) => {
    try {
        const { url, numberOfQuestions = 5 } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const videoId = ytdl.getVideoID(url);
        const videoInfo = await ytdl.getInfo(videoId);
        const videoTitle = videoInfo.videoDetails.title;
        
        const captions = await getSubtitles({
            videoID: videoId,
            lang: 'en'
        });

        const videoText = captions.map(caption => caption.text).join(' ');
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Based on this video content, generate ${numberOfQuestions} multiple choice questions:
            ${videoText.substring(0, 15000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const parsedData = cleanAndParseJSON(response.text());
        
        const newQuiz = new QuizModel({
            topic: videoTitle || 'Video Quiz',
            questions: parsedData.questions.map(shuffleOptions),
            user: req.user.userId
        });

        const savedQuiz = await newQuiz.save();
        res.json(savedQuiz);

    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ error: 'Failed to process video', details: error.message });
    }
}; 