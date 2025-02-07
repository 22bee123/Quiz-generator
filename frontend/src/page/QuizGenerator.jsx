import { useState } from 'react';
import axios from 'axios';

export function QuizGenerator() {
    const [topic, setTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAnswers, setShowAnswers] = useState(false);
    const [file, setFile] = useState(null);
    const [useFile, setUseFile] = useState(false);

    const generateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setQuiz(null);
        setShowAnswers(false);

        try {
            let response;
            if (useFile && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('numberOfQuestions', numberOfQuestions);

                response = await axios.post('http://localhost:5000/api/generate-quiz-from-file', 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            } else {
                response = await axios.post('http://localhost:5000/api/generate-quiz', {
                    topic,
                    numberOfQuestions: parseInt(numberOfQuestions)
                });
            }
            
            if (response.data) {
                setQuiz(response.data);
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            setError(error.response?.data?.error || 'Failed to generate quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setTopic(selectedFile.name); // Set topic to filename by default
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">AI Quiz Generator</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            <form onSubmit={generateQuiz} className="mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Generate questions from:
                    </label>
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setUseFile(false)}
                            className={`px-4 py-2 rounded ${!useFile 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200'}`}
                        >
                            Topic
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseFile(true)}
                            className={`px-4 py-2 rounded ${useFile 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200'}`}
                        >
                            File Upload
                        </button>
                    </div>
                </div>

                {!useFile ? (
                    <div className="mb-4">
                        <label className="block mb-2">Topic:</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="border p-2 w-full rounded"
                            required
                            disabled={loading}
                        />
                    </div>
                ) : (
                    <div className="mb-4">
                        <label className="block mb-2">Upload File:</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="border p-2 w-full rounded"
                            accept=".txt,.pdf,.doc,.docx"
                            required
                            disabled={loading}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Supported formats: .txt, .pdf, .doc, .docx
                        </p>
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block mb-2">Number of Questions:</label>
                    <input
                        type="number"
                        value={numberOfQuestions}
                        onChange={(e) => setNumberOfQuestions(e.target.value)}
                        min="1"
                        max="20"
                        className="border p-2 rounded"
                        required
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className={`px-4 py-2 rounded ${loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                    disabled={loading}
                >
                    {loading ? 'Generating...' : 'Generate Quiz'}
                </button>
            </form>

            {quiz && (
                <div className="quiz-container">
                    <h2 className="text-2xl font-bold mb-4">Quiz: {quiz.topic}</h2>
                    {quiz.questions.map((q, index) => (
                        <div key={index} className="mb-6 p-4 border rounded shadow">
                            <p className="font-bold mb-2">{index + 1}. {q.question}</p>
                            {Object.entries(q.options).map(([key, value]) => (
                                <div key={key} className="ml-4 mb-2 p-2 hover:bg-gray-100 rounded">
                                    <span className="font-bold mr-2">{key}:</span> {value}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Toggle Answers Button */}
                    <div className="mt-6 mb-4">
                        <button
                            onClick={() => setShowAnswers(!showAnswers)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                            {showAnswers ? 'Hide Answers' : 'Show Answers'}
                        </button>
                    </div>

                    {/* Answer Key Section */}
                    {showAnswers && (
                        <div className="answer-key bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-bold mb-3">Answer Key:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {quiz.questions.map((q, index) => (
                                    <div key={index} className="bg-white p-3 rounded shadow">
                                        <span className="font-semibold">Question {index + 1}:</span>
                                        <span className="ml-2 text-green-600 font-bold">
                                            {q.correctAnswer}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}