import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useTheme } from '../context/ThemeContext';

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
    const { isDark, toggleTheme } = useTheme();
    const [isCopied, setIsCopied] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [isProcessingVideo, setIsProcessingVideo] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

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
        const validTypes = [
            'application/pdf', 
            'application/msword', 
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska'
        ];
        return validTypes.includes(file.type);
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            // Basic check for video platforms
            return url.includes('youtube.com') || 
                   url.includes('youtu.be') || 
                   url.includes('vimeo.com');
        } catch {
            return false;
        }
    };

    const clearFile = () => {
        setFile(null);
        setTopic('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleVoiceRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setTopic(''); // Clear existing topic
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setTopic(transcript);
            setNumberOfQuestions(5); // Set to generate 5 questions
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            let response;
            
            if (audioBlob) {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                response = await axios.post(
                    'http://localhost:5000/api/generate-quiz-from-voice',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                // Extract quiz from the response structure
                const quizData = response.data.quiz;
                setQuiz(quizData);
                setQuizHistory(prev => [quizData, ...prev]);
                setAudioBlob(null); // Clear the audio blob after submission
            } else if (videoUrl) {
                setIsProcessingVideo(true);
                response = await axios.post(
                    'http://localhost:5000/api/generate-quiz-from-url',
                    { url: videoUrl, numberOfQuestions },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            } else if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('numberOfQuestions', numberOfQuestions);
                formData.append('isVideo', file.type.startsWith('video/'));

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
            } else if (topic) {
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
                setQuiz(response.data);
                setQuizHistory(prev => [response.data, ...prev]);
            } else {
                throw new Error('Please provide either a voice recording, video URL, file, or topic');
            }
            
            setError(null);
            setVideoUrl('');
        } catch (error) {
            console.error('Error generating quiz:', error);
            setError(error.response?.data?.error || error.message || 'Failed to generate quiz');
            if (error.message === 'No authentication token found') {
                navigate('/login');
            }
        } finally {
            setLoading(false);
            setIsProcessingVideo(false);
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

    useEffect(() => {
        // Cleanup function to stop recording if component unmounts while recording
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const copyQuizToClipboard = (quiz) => {
        let quizText = `Quiz: ${quiz.topic}\n\n`;
        
        // Questions and options first
        quizText += "Questions:\n\n";
        quiz.questions.forEach((q, index) => {
            quizText += `Question ${index + 1}: ${q.question}\n`;
            Object.entries(q.options).forEach(([key, value]) => {
                quizText += `${key}) ${value}\n`;
            });
            quizText += '\n';
        });

        // All answers at the end
        quizText += "Answers:\n\n";
        quiz.questions.forEach((q, index) => {
            quizText += `Question ${index + 1}: ${q.correctAnswer}\n`;
        });

        navigator.clipboard.writeText(quizText)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy quiz:', err);
            });
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#262626] text-white' : 'bg-[#ddddd5] text-gray-900'}`}>
            {/* Add Theme toggle button */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 p-2 rounded-full 
                         bg-white/10 backdrop-blur-lg border border-white/20 
                         hover:bg-white/20 transition-colors duration-200
                         shadow-lg"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    // Sun icon for dark mode
                    <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    // Moon icon for light mode
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>

            <Sidebar 
                quizHistory={quizHistory} 
                onQuizSelect={setQuiz}
                onSidebarToggle={setIsSidebarOpen}
                isDark={isDark}
            />
            
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
                <div className={`transform transition-all duration-1000 ease-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className='flex items-center justify-center'>
                        <div className={`flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-4xl p-6 w-30%`}>
                            <h1 className={`${isDark ? 'text-white' : 'text-gray-900'} text-6xl font-bold text-center mb-4 mt-4 tracking-wider`}>
                                Quiz Generator
                            </h1>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto p-6">
                        <div className="space-y-6">

                            {error && (
                                <div className={`${isDark ? 'bg-red-900/10 border-red-500/50 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} px-4 py-3 rounded border`}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className={`${isDark ? 'bg-[#363636]' : 'bg-[#cecec7]'} rounded-lg p-6 space-y-4 shadow-lg`}>
                                {/* Video URL Input */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Video URL (YouTube or Vimeo)
                                    </label>
                                    <input
                                        type="url"
                                        value={videoUrl}
                                        onChange={(e) => {
                                            setVideoUrl(e.target.value);
                                            if (e.target.value) {
                                                setFile(null);
                                                setTopic('');
                                            }
                                        }}
                                        placeholder="Paste video URL here..."
                                        className={`w-full px-3 py-2 rounded-md 
                                                 ${isDark 
                                                     ? 'bg-[#262626] border-gray-600 text-white placeholder-gray-400' 
                                                     : 'bg-[#ddddd5] border-gray-400 text-black placeholder-gray-500'}
                                             border focus:outline-none focus:ring-2 focus:ring-gray-500`}
                                    />
                                </div>

                                <div className="text-center text-sm text-gray-500 my-2">- OR -</div>

                                <div 
                                    className={`border-2 border-dashed rounded-lg p-6 transition-colors
                                        ${isDragging 
                                            ? 'border-green-500 bg-green-500/10' 
                                            : isDark 
                                                ? 'border-gray-600 hover:border-gray-500 bg-[#262626]' 
                                                : 'border-gray-400 hover:border-gray-300 bg-[#ddddd5]'}`}
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
                                                        accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.avi,.mkv"
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, MP4, MOV, AVI, MKV up to 100MB</p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center text-sm text-gray-500 my-2">- OR -</div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-gray-300 mb-2">Topic or Subject</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-md 
                                                     ${isDark 
                                                         ? 'bg-[#262626] border-gray-600 text-white placeholder-gray-400' 
                                                         : 'bg-[#ddddd5] border-gray-400 text-black placeholder-gray-500'}
                                                     border focus:outline-none focus:ring-2 focus:ring-gray-500`}
                                            placeholder="Enter a topic for your quiz... (optional)"
                                        />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Questions
                                        </label>
                                        <input
                                            type="number"
                                            value={numberOfQuestions}
                                            onChange={(e) => setNumberOfQuestions(e.target.value)}
                                            min="1"
                                            max="10"
                                            className={`w-full px-3 py-2 rounded-md 
                                                       ${isDark 
                                                           ? 'bg-[#262626] border-gray-600 text-white' 
                                                           : 'bg-[#ddddd5] border-gray-400 text-gray-900'} 
                                                       border focus:outline-none focus:ring-2 focus:ring-gray-500`}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                {/* Voice Recognition Button */}
                                <button 
                                    type="button"
                                    onClick={handleVoiceRecognition}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 mb-4
                                        ${isDark 
                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                            : 'bg-blue-500 hover:bg-blue-600'}
                                        text-white`}
                                    disabled={isListening}
                                >
                                    {isListening ? (
                                        <>
                                            <div className="animate-pulse">Listening...</div>
                                            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                            </svg>
                                        </>
                                    ) : (
                                        <>
                                            <span>Speak To Generate</span>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {/* Existing Generate Quiz button */}
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
                                <div className={`mt-8 space-y-8 ${isDark ? 'bg-[#363636]' : 'bg-[#cecec7]'} rounded-lg p-6`}>
                                    {/* Quiz header with title and show answers button */}
                                    <div className={`${isDark ? 'bg-gray-800' : 'bg-[#ddddd5]'} rounded-lg p-6`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Quiz: {quiz.topic}
                                            </h2>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => copyQuizToClipboard(quiz)}
                                                    className={`px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2
                                                            ${isDark 
                                                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                                                : 'bg-[#cecec7] hover:bg-[#bebeb7] text-gray-900'}`}
                                                    title="Copy quiz to clipboard"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <svg 
                                                                className="w-5 h-5" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path 
                                                                    strokeLinecap="round" 
                                                                    strokeLinejoin="round" 
                                                                    strokeWidth={2} 
                                                                    d="M5 13l4 4L19 7" 
                                                                />
                                                            </svg>
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg 
                                                                className="w-5 h-5" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path 
                                                                    strokeLinecap="round" 
                                                                    strokeLinejoin="round" 
                                                                    strokeWidth={2} 
                                                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
                                                                />
                                                            </svg>
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setShowAnswers(!showAnswers)}
                                                    className={`px-4 py-2 rounded-md transition-colors duration-200
                                                            ${isDark 
                                                                ? 'bg-green-600 hover:bg-green-700' 
                                                                : 'bg-green-500 hover:bg-green-600'}
                                                            text-white`}
                                                >
                                                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Questions display */}
                                        <div className="space-y-8">
                                            {quiz.questions.map((q, i) => (
                                                <div key={i} className="space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <span className={`flex-shrink-0 w-8 h-8 rounded-full 
                                                                     ${isDark ? 'bg-gray-700' : 'bg-[#cecec7]'} 
                                                                     flex items-center justify-center text-sm font-medium
                                                                     ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {i + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className={`text-lg mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                                {q.question}
                                                            </p>
                                                            <div className="grid gap-3">
                                                                {Object.entries(q.options).map(([key, value]) => (
                                                                    <div
                                                                        key={key}
                                                                        className={`p-3 rounded-lg border-2 border-gray-400 transition-colors duration-200
                                                                            ${showAnswers && key === q.correctAnswer
                                                                                ? isDark 
                                                                                    ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                                                                    : 'bg-green-100 border-green-500 text-green-800'
                                                                                : isDark 
                                                                                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700'
                                                                                    : 'bg-[#ddddd5] border-gray-300 text-gray-800 hover:bg-[#cecec7]'
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
                                        <div className={`${isDark ? 'bg-gray-800' : 'bg-[#ddddd5]'} rounded-lg p-6 mt-4`}>
                                            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Answers
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                                {quiz.questions.map((q, i) => (
                                                    <div key={i} className={`${isDark ? 'bg-gray-700/50' : 'bg-[#cecec7]'} rounded-lg p-3`}>
                                                        <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
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
                </div>
            </main>
        </div>
    );
} 