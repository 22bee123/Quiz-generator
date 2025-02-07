import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export function shuffleOptions(question) {
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

export function cleanAndParseJSON(content) {
    try {
        content = content.replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .trim();
        
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No valid JSON found in response');
        }
        
        content = content.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(content);
        
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid quiz format');
        }
        
        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse quiz data: ${error.message}`);
    }
} 