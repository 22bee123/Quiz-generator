import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Sidebar({ quizHistory, onQuizSelect, onSidebarToggle }) {
    const [isOpen, setIsOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // First try to get user from localStorage
                const storedUser = localStorage.getItem('user');
                console.log('Stored user from localStorage:', storedUser); // Debug log

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('Parsed user from localStorage:', parsedUser); // Debug log
                    setUser(parsedUser);
                }

                // Then fetch fresh data from API
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('API response data:', response.data); // Debug log
                setUser(response.data);
                
                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(response.data));
            } catch (error) {
                console.error('Error fetching profile:', error);
                if (error.response?.status === 401) {d 
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

        // Close sidebar on mobile by default
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [navigate]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
        onSidebarToggle?.(!isOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleQuizClick = (quiz) => {
        onQuizSelect(quiz);
        if (window.innerWidth < 768) {
            setIsOpen(false);
            onSidebarToggle?.(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-20"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full transition-all duration-300 z-30
                bg-gray-900 border-r border-gray-700
                ${isOpen ? 'w-64' : 'w-16'}
                ${isOpen ? 'translate-x-0' : '-translate-x-0'}
                md:translate-x-0`}
            >
                <div className="p-4 h-full flex flex-col">
                    {/* Toggle Button - Always visible */}
                    <button 
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-4 bg-gray-900 rounded-full p-1.5 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        {isOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>

                    {/* User Profile Section */}
                    <div className="mb-8 text-center relative">
                        {isOpen ? (
                            <>
                                <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-gray-800 border border-gray-700">
                                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
                                        {loading ? '...' : (user?.name ? user.name[0].toUpperCase() : '?')}
                                    </div>
                                </div>
                                <div className="text-gray-200">
                                    <h3 className="font-medium">
                                        {loading ? 'Loading...' : (user?.name || 'Guest')}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {user?.email || 'No email'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {user?.userType === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="w-8 h-8 rounded-full mx-auto overflow-hidden bg-gray-800 border border-gray-700">
                                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
                                    {loading ? '.' : (user?.name ? user.name[0].toUpperCase() : '?')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quiz History Section - Conditional rendering based on isOpen */}
                    <div className="flex-1 overflow-hidden">
                        {isOpen ? (
                            <div className="px-4 py-2">
                                <h3 className="text-md text-center font-semibold text-gray-400 uppercase tracking-wider mb-9">
                                    Recent Quizzes
                                </h3>
                                <div className="space-y-2 max-h-94 overflow-y-auto custom-scrollbar pr-2">
                                    {quizHistory && quizHistory.length > 0 ? (
                                        quizHistory.map((quiz) => (
                                            <button

                                                key={quiz._id}
                                                onClick={() => handleQuizClick(quiz)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200
                                                    hover:bg-gray-800 text-gray-300 hover:text-white"
                                            >
                                                <div className="font-medium truncate">{quiz.topic}</div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(quiz.createdAt)}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No quizzes yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                {quizHistory?.slice(0, 5).map((quiz) => (
                                    <button
                                        key={quiz._id}
                                        onClick={() => handleQuizClick(quiz)}
                                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                                        title={quiz.topic}
                                    >
                                        {quiz.topic[0].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Logout Button - Conditional rendering */}
                    <button
                        onClick={handleLogout}
                        className={`mt-4 ${isOpen ? 'w-full px-4' : 'w-8 h-8 mx-auto'} 
                            py-2 text-sm text-gray-400 hover:text-white hover:bg-green-700  
                            rounded-lg transition-colors   duration-200 flex items-center justify-center`}
                        title="Logout"
                    >
                        {isOpen ? (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
} 