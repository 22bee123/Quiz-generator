import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

export function Sidebar({ quizHistory, onQuizSelect, onSidebarToggle }) {
    const [isOpen, setIsOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isDark } = useTheme();

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
                ${isDark 
                    ? 'bg-[#262626] border-gray-700' 
                    : 'bg-[#ddddd5] border-gray-200'} 
                border-r
                ${isOpen ? 'w-64' : 'w-12'}
                ${!isOpen && 'translate-x-0'}
                md:translate-x-0`}
            >
                <div className="p-2 h-full flex flex-col">
                    {/* Toggle Button */}
                    <button 
                        onClick={toggleSidebar}
                        className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} 
                            transition-colors duration-200 mb-4
                            ${isOpen ? 'ml-auto' : 'mx-auto'}`}
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

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center justify-center px-2 py-2 rounded-lg mb-2 transition-colors duration-200
                                ${isActive 
                                    ? isDark 
                                        ? 'bg-[#363636] text-white' 
                                        : 'bg-[#cecec7] text-gray-900'
                                    : isDark 
                                        ? 'text-gray-400 hover:bg-[#363636] hover:text-white' 
                                        : 'text-gray-600 hover:bg-[#cecec7] hover:text-gray-900'}`
                            }
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {isOpen && <span className="ml-2">Home</span>}
                        </NavLink>

                        {/* Profile Section */}
                        <div className="mb-4 text-center">
                            <div className={`${isOpen ? 'w-16 h-16' : 'w-8 h-8'} rounded-full mx-auto mb-2 overflow-hidden 
                                ${isDark ? 'bg-[#363636] border-gray-700' : 'bg-[#cecec7] border-gray-200'} 
                                border transition-all duration-300`}>
                                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white"
                                     style={{ fontSize: isOpen ? '1.25rem' : '0.875rem' }}>
                                    {loading ? '...' : (user?.name ? user.name[0].toUpperCase() : '?')}
                                </div>
                            </div>
                            {isOpen && (
                                <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                                    <h3 className="font-medium text-sm">
                                        {loading ? 'Loading...' : (user?.name || 'Guest')}
                                    </h3>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {user?.userType || 'Student'}
                                    </p>
                                    <NavLink 
                                        to="/profile"
                                        className={`mt-2 text-base font-medium 
                                            ${isDark 
                                                ? 'text-gray-400 hover:text-white' 
                                                : 'text-gray-600 hover:text-gray-900'} 
                                            transition-colors duration-200 block`}
                                    >
                                        View Profile
                                    </NavLink>
                                </div>
                            )}
                            {!isOpen && (
                                <NavLink 
                                    to="/profile"
                                    title="View Profile"
                                    className={`mt-1 text-gray-400 hover:text-white transition-colors duration-200 block`}
                                >
                                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </NavLink>
                            )}
                        </div>

                        {/* Quiz History */}
                        <div className="px-1 flex flex-col items-center flex-grow h-[calc(100vh-300px)]">
                            {isOpen && (
                                <h3 className={`text-md pt-5 font-semibold uppercase tracking-wider mb-2 text-center w-full
                                    ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Recent Quizzes:
                                </h3>
                                
                            )}
                            
                            <div className="space-y-1 w-full flex flex-col items-center h-full overflow-y-auto overflow-x-hidden
                                    scrollbar-thin scrollbar-thumb-rounded-full
                                    scrollbar-track-transparent
                                    hover:scrollbar-thumb-gray-500/30
                                    dark:hover:scrollbar-thumb-gray-400/30">
                                {quizHistory && quizHistory.length > 0 ? (
                                    quizHistory.map((quiz) => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => handleQuizClick(quiz)}
                                            title={!isOpen ? quiz.topic : ''}
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 w-full
                                                ${isDark 
                                                    ? 'text-gray-400 hover:bg-[#363636] hover:text-white' 
                                                    : 'text-gray-600 hover:bg-[#cecec7] hover:text-gray-900'}`}
                                        >
                                            {isOpen ? (
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-sm font-bold truncate">{quiz.topic}</span>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                                        {formatDate(quiz.createdAt)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center w-full">
                                                    <span className="text-sm">{quiz.topic.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-center py-2`}>
                                        {isOpen ? 'No quizzes yet' : '−'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`mt-2 flex items-center justify-center p-2 rounded-lg transition-all duration-200
                            ${isDark 
                                ? 'text-gray-400' 
                                : 'text-gray-600'}
                            [&:hover]:bg-green-500 [&:hover]:text-white`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {isOpen && <span className="ml-2">Logout</span>}
                    </button>
                </div>
            </div>
        </>
    );
} 