import { useState } from 'react';
import axios from 'axios';

export function QuizGenerator() {
    const [topic, setTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setQuiz(null);

        try {
            const response = await axios.post('http://localhost:5000/api/generate-quiz', {
                topic,
                numberOfQuestions: parseInt(numberOfQuestions)
            });
            
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
                </div>
            )}
        </div>
    );
}