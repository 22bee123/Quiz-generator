import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizModel from '../model/quiz.model.js';
import { cleanAndParseJSON } from '../utils/quiz.utils.js';
import { getSubtitles } from 'youtube-captions-scraper';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

export const generateQuizFromUrl = async (req, res) => {
    try {
        const { url, numberOfQuestions = 5 } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Try to get captions (including auto-generated ones)
        let captions;
        try {
            // First try to get manual English captions
            captions = await getSubtitles({
                videoID: videoId,
                lang: 'en'
            });
        } catch (error) {
            try {
                // If manual captions fail, try auto-generated captions
                captions = await getSubtitles({
                    videoID: videoId,
                    lang: 'en',
                    auto: true
                });
            } catch (autoError) {
                return res.status(400).json({ 
                    error: 'Could not find any English captions or auto-generated subtitles for this video.' 
                });
            }
        }

        if (!captions || captions.length === 0) {
            return res.status(400).json({ 
                error: 'No captions found for this video.' 
            });
        }

        // Convert captions to text
        const transcriptText = captions
            .map(caption => caption.text)
            .join(' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (transcriptText.length < 50) {
            return res.status(400).json({ 
                error: 'Caption content is too short to generate meaningful questions.' 
            });
        }

        // Generate quiz using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Generate ${numberOfQuestions} multiple choice questions based on this video transcript.
            Each question must be directly based on specific information mentioned in the transcript.
            Make questions that test understanding of key concepts, facts, and details from the video.
            
            Format the response as a JSON object with this structure:
            {
                "questions": [
                    {
                        "question": "question text that directly references content from the transcript",
                        "options": {
                            "A": "first option (include actual content/facts from video)",
                            "B": "second option",
                            "C": "third option",
                            "D": "fourth option"
                        },
                        "correctAnswer": "A"
                    }
                ]
            }
            
            Video Transcript:
            ${transcriptText.substring(0, 15000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const parsedData = cleanAndParseJSON(response.text());

        if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Failed to generate valid quiz questions from video content');
        }
        
        const newQuiz = new QuizModel({
            topic: 'Video Quiz',
            questions: parsedData.questions,
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
};