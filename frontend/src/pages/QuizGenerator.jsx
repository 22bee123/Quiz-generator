import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';

export function QuizGenerator() {
    const [topic, setTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showAnswers, setShowAnswers] = useState(false);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidFileType(droppedFile)) {
            setFile(droppedFile);
            setTopic(droppedFile.name.replace(/\.[^/.]+$/, "")); // Remove file extension
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && isValidFileType(selectedFile)) {
            setFile(selectedFile);
            setTopic(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove file extension
        }
    };

    const isValidFileType = (file) => {
        const validTypes = ['application/pdf', 'application/msword', 'text/plain', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return validTypes.includes(file.type);
    };

    const clearFile = () => {
        setFile(null);
        setTopic('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
            if (file) {
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
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }
            
            if (response.data) {
                setQuiz(response.data);
                setQuizHistory(prev => [response.data, ...prev]);
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
            
            console.log('Fetched quiz history:', response.data); // Debug log
            setQuizHistory(response.data);
        } catch (error) {
            console.error('Error fetching quiz history:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    // Fetch quiz history on component mount and after generating a new quiz
    useEffect(() => {
        fetchQuizHistory();
    }, []);

    // Refresh quiz history after generating a new quiz
    useEffect(() => {
        if (quiz) {
            fetchQuizHistory();
        }
    }, [quiz]);

    return (
        <div className="flex min-h-screen bg-[#343541] items-center justify-center">
            <Sidebar 
                quizHistory={quizHistory} 
                onQuizSelect={setQuiz}
                onSidebarToggle={setIsSidebarOpen}
            />
            
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
                <div className='flex items-center justify-center'>
                    <div className='flex items-center justify-center bg-gray-800 rounded-4xl p-6 w-30%'>
                        <h1 className='text-white text-6xl font-bold text-center mb-4 mt-4 tracking-wider' >Quiz Generator</h1>
                    </div>
                </div>

                



                <div className="max-w-4xl mx-auto p-6">
                    <div className="space-y-6">


                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={generateQuiz} className="bg-gray-800 rounded-lg p-6 space-y-4">
                            <div 
                                className={`border-2 border-dashed rounded-lg p-6 transition-colors
                                    ${isDragging 
                                        ? 'border-green-500 bg-gray-800/50' 
                                        : 'border-gray-600 hover:border-gray-500'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {file ? (
                                    <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-gray-200">{file.name}</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={clearFile}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <div className="mt-4 flex justify-center text-sm text-gray-400">
                                            <label className="relative cursor-pointer rounded-md font-medium text-green-500 hover:text-green-400">
                                                <span>Upload a file</span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="sr-only"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.doc,.docx,.txt"
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, DOC, DOCX or TXT up to 10MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-gray-300 mb-2">Topic or Subject</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="chat-input"
                                        placeholder="Enter a topic for your quiz..."
                                        required
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-gray-300 mb-2">Questions</label>
                                    <input
                                        type="number"
                                        value={numberOfQuestions}
                                        onChange={(e) => setNumberOfQuestions(e.target.value)}
                                        min="1"
                                        max="10"
                                        className="chat-input"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generating Quiz...
                                    </>
                                ) : 'Generate Quiz'}
                            </button>
                        </form>

                        {/* Quiz Display */}
                        {quiz && (
                            <div className="mt-8 space-y-8">
                                {/* Quiz header with title and show answers button */}
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-white">Quiz: {quiz.topic}</h2>
                                        <button
                                            onClick={() => setShowAnswers(!showAnswers)}
                                            className="btn-primary"
                                        >
                                            {showAnswers ? 'Hide Answers' : 'Show Answers'}
                                        </button>
                                    </div>
                                    
                                    {/* Existing quiz questions display */}
                                    <div className="space-y-8">
                                        {quiz.questions.map((q, i) => (
                                            <div key={i} className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-lg text-gray-100 mb-4">{q.question}</p>
                                                        <div className="grid gap-3">
                                                            {Object.entries(q.options).map(([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className={`p-3 rounded-lg border transition-colors duration-200
                                                                        ${showAnswers && key === q.correctAnswer
                                                                            ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                                                            : 'bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-medium">{key}.</span>
                                                                        <span>{value}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Answers section */}
                                {showAnswers && (
                                    <div className="bg-gray-800 rounded-lg p-6 mt-4">
                                        <h3 className="text-xl font-bold text-white mb-4">Answers</h3>
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                            {quiz.questions.map((q, i) => (
                                                <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                                                    <span className="text-gray-200">
                                                        Q{i + 1}: <span className="font-bold">Option {q.correctAnswer}</span>
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
            </main>
        </div>
    );
} 