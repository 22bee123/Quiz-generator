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
                    {/* User Profile Section */}
                    <div className="mb-8 text-center relative">
                        {/* Toggle Button */}
                        <button 
                            onClick={toggleSidebar}
                            className="absolute -right-2 top-2 text-gray-400 hover:text-white transition-colors duration-200"
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

                        {isOpen && (
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
                                <NavLink 
                                    to="/profile"
                                    className="mt-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    View Profile
                                </NavLink>
                            </>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        {/* Home Link */}
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 rounded-lg mb-2 transition-colors duration-200
                                ${isActive 
                                    ? 'bg-gray-700 text-white' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                            }
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </NavLink>

                        {/* Quiz History */}
                        <div className="px-4 py-2">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Recent Quizzes
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {quizHistory && quizHistory.length > 0 ? (
                                    quizHistory.map((quiz) => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => handleQuizClick(quiz)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200"
                                        >
                                            {quiz.topic}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        No quizzes yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="mt-4 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
} 