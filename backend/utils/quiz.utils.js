import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export function shuffleOptions(question) {
    const originalOptions = question.options;
    
    // If options is already in the correct format, just return
    if (typeof originalOptions === 'object' && !Array.isArray(originalOptions)) {
        return question;
    }

    // Convert array to object with A, B, C, D keys
    const optionsArray = Array.isArray(originalOptions) 
        ? originalOptions 
        : Object.values(originalOptions);
    
    // Create a copy of the array to shuffle
    const shuffled = [...optionsArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Convert back to object with A, B, C, D keys
    const letters = ['A', 'B', 'C', 'D'];
    const newOptions = {};
    shuffled.forEach((option, index) => {
        newOptions[letters[index]] = option;
    });
    
    // Find the letter key of the correct answer
    let correctAnswerKey = Object.keys(newOptions).find(
        key => newOptions[key] === question.correctAnswer
    );
    
    return {
        question: question.question,
        options: newOptions,
        correctAnswer: correctAnswerKey
    };
}

export async function extractTextFromFile(filePath, mimeType) {
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
        throw new Error(`Failed to extract text from file: ${error.message}`);
    }
}

export const cleanAndParseJSON = (content) => {
    try {
        // Find the first occurrence of '[' or '{'
        const jsonStart = content.indexOf('[') !== -1 ? content.indexOf('[') : content.indexOf('{');
        // Find the last occurrence of ']' or '}'
        const jsonEnd = content.lastIndexOf(']') !== -1 ? content.lastIndexOf(']') : content.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No valid JSON found in response');
        }
        
        content = content.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(content);
        
        // Ensure we always return an object with a questions array
        if (Array.isArray(parsed)) {
            return { questions: parsed };
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
            return parsed;
        } else {
            throw new Error('Invalid quiz format: missing questions array');
        }
    } catch (error) {
        console.error('Error parsing quiz JSON:', error);
        throw new Error(`Failed to parse quiz data: ${error.message}`);
    }
}