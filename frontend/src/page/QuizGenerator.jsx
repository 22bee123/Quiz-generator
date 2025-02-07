import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

export function QuizGenerator() {
    const [topic, setTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const fetchQuizHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/quizzes', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setQuizHistory(response.data);
        } catch (error) {
            console.error('Error fetching quiz history:', error);
        }
    };

    useEffect(() => {
        fetchQuizHistory();
    }, [quiz]);

    const generateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            let response;
            if (useFile && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('numberOfQuestions', numberOfQuestions);

                response = await axios.post(
                    'http://localhost:5000/api/generate-quiz-from-file', 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } else {
                response = await axios.post(
                    'http://localhost:5000/api/generate-quiz',
                    {
                        topic,
                        numberOfQuestions: parseInt(numberOfQuestions)
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }
            
            if (response.data) {
                setQuiz(response.data);
                setError(null);
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            setError(error.response?.data?.error || 'Failed to generate quiz');
            if (error.message === 'No authentication token found') {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar 
                quizHistory={quizHistory} 
                onQuizSelect={setQuiz}
                onSidebarToggle={setIsSidebarOpen}
            />
            
            <main className={`flex-1 p-8 transition-all duration-300
                ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}
            >
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Quiz Generator</h1>
                    
                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={generateQuiz} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                        <div>
                            <label className="block text-gray-700 mb-2">Topic:</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Number of Questions:</label>
                            <input
                                type="number"
                                value={numberOfQuestions}
                                onChange={(e) => setNumberOfQuestions(e.target.value)}
                                min="1"
                                max="10"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 
                                disabled:bg-gray-400 transition-colors duration-200"
                        >
                            {loading ? 'Generating...' : 'Generate Quiz'}
                        </button>
                    </form>

                    {quiz && (
                        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold mb-4">Quiz: {quiz.topic}</h2>
                            <div className="space-y-6">
                                {quiz.questions.map((q, i) => (
                                    <div key={i} className="p-4 border rounded">
                                        <p className="font-bold mb-3">{i + 1}. {q.question}</p>
                                        <div className="ml-4 space-y-2">
                                            {Object.entries(q.options).map(([key, value]) => (
                                                <div key={key} className="flex items-center">
                                                    <span className="font-bold mr-2">{key}.</span>
                                                    <span>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}