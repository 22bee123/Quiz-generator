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
    const [showAnswers, setShowAnswers] = useState(false);
    const [file, setFile] = useState(null);
    const [useFile, setUseFile] = useState(false);
    const [quizHistory, setQuizHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    // Fetch quiz history when component mounts
    useEffect(() => {
        const fetchQuizHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/quizzes', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setQuizHistory(response.data);
            } catch (error) {
                console.error('Error fetching quiz history:', error);
                setError('Failed to fetch quiz history');
            }
        };

        fetchQuizHistory();
    }, [quiz]); // Refetch when new quiz is generated

    const generateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setQuiz(null);
        setShowAnswers(false);

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
                if (!response.data.questions || response.data.questions.length === 0) {
                    throw new Error('No questions were generated. Please try again.');
                }
                setQuiz(response.data);
                // Clear any existing error
                setError(null);
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            setError(
                error.response?.data?.details || 
                error.response?.data?.error || 
                error.message || 
                'Failed to generate quiz. Please try again.'
            );
            if (error.message === 'No authentication token found') {
                navigate('/login');
            }
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

    const handleQuizSelect = (selectedQuiz) => {
        setQuiz(selectedQuiz);
        setTopic(selectedQuiz.topic);
        setNumberOfQuestions(selectedQuiz.questions.length);
        setShowAnswers(false);
    };

    const handleSidebarToggle = (isOpen) => {
        setIsSidebarOpen(isOpen);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar 
                quizHistory={quizHistory} 
                onQuizSelect={handleQuizSelect}
                onSidebarToggle={handleSidebarToggle}
            />
            
            <div className={`flex-1 transition-all duration-300 p-8 
                ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
                
                {/* Quiz Generator Header */}
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">AI Quiz Generator</h1>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    
                    {/* Form Section */}
                    <form onSubmit={generateQuiz} className="mb-6 bg-white rounded-lg shadow-md p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Generate questions from:
                            </label>
                            <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setUseFile(false)}
                                    className={`px-4 py-2 rounded transition-colors duration-200 ${
                                        !useFile 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    Topic
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseFile(true)}
                                    className={`px-4 py-2 rounded transition-colors duration-200 ${
                                        useFile 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-200'
                                    }`}
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

                    {/* Quiz Display Section */}
                    {quiz && (
                        <div className="quiz-container bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold mb-4">Quiz: {quiz.topic}</h2>
                            <div className="space-y-4">
                                {quiz.questions.map((q, index) => (
                                    <div key={index} className="p-4 border rounded-lg hover:border-blue-200 transition-colors duration-200">
                                        <p className="font-bold mb-2">{index + 1}. {q.question}</p>
                                        <div className="grid gap-2">
                                            {Object.entries(q.options).map(([key, value]) => (
                                                <div 
                                                    key={key} 
                                                    className="ml-4 p-2 hover:bg-gray-50 rounded-md transition-colors duration-200"
                                                >
                                                    <span className="font-bold mr-2">{key}:</span> {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Toggle Answers Button */}
                            <div className="mt-6 mb-4">
                                <button
                                    onClick={() => setShowAnswers(!showAnswers)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors duration-200"
                                >
                                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                                </button>
                            </div>

                            {/* Answer Key Section */}
                            {showAnswers && (
                                <div className="answer-key bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-xl font-bold mb-3">Answer Key:</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {quiz.questions.map((q, index) => (
                                            <div key={index} className="bg-white p-3 rounded shadow hover:shadow-md transition-shadow duration-200">
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
            </div>
        </div>
    );
}