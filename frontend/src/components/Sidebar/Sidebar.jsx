import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

export function Sidebar({ quizHistory, onQuizSelect, onSidebarToggle }) {
    const [isOpen, setIsOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isDark } = useTheme();

    // Define fetchProfile as a useCallback to avoid recreation on each render
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Fetch fresh data from API first
            const response = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update state and localStorage with fresh data
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Initial load and mobile setup
    useEffect(() => {
        fetchProfile();

        // Close sidebar on mobile by default
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [fetchProfile]);

    // Add listener for profile updates
    useEffect(() => {
        const handleUserUpdate = () => {
            console.log('Profile update detected, refreshing...');
            fetchProfile();
        };

        window.addEventListener('userUpdated', handleUserUpdate);

        return () => {
            window.removeEventListener('userUpdated', handleUserUpdate);
        };
    }, [fetchProfile]);

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
            <div className={`fixed left-0 top-0 h-screen transition-all duration-300 z-30 sidebar-content
                ${isDark ? 'bg-[#262626] border-gray-700' : 'bg-[#ddddd5] border-gray-200'} 
                border-r
                ${isOpen ? 'w-75' : 'w-12'}
                ${!isOpen && 'translate-x-0'}
                md:translate-x-0`}
            >
                <div className="p-2 h-full flex flex-col">
                    {/* Toggle Button */}
                    <button 
                        onClick={toggleSidebar}
                        className={`${isDark ? 'text-gray-400 hover:text-green-500' : 'text-gray-600 hover:text-gray-900'} 
                            transition-colors duration-200 mb-4
                            ${isOpen ? 'ml-auto' : 'mx-auto'}`}
                    >
                        {isOpen ? (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>

                    {/* Navigation */}
                    <div className="flex-1 overflow-hidden">
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

                        {/* Profile Section with key for forcing re-render */}
                        <div key={user?.profilePicture} className="mb-4 text-center flex items-center justify-center flex-col">
                            {/* Profile Picture */}
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20">
                                {user?.profilePicture ? (
                                    <img
                                        src={`http://localhost:5000${user.profilePicture}`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {isOpen && (
                                <div className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                                    <h3 className="font-medium text-md mt-2">
                                        {loading ? 'Loading...' : (user?.name || 'Guest')}
                                    </h3>
                                    <p className={`text-md ${isDark ? 'text-gray-400' : 'text-black'}`}>
                                        {user?.userType || 'Student'}
                                    </p>
                                    <NavLink 
                                        to="/profile"
                                        className={`mt-2 text-base font-medium 
                                            ${isDark 
                                                ? 'text-gray-400 hover:text-white' 
                                                : 'text-black hover:text-gray-900'} 
                                            transition-colors duration-200 block`}
                                    >
                                        <div className="flex items-center mt-8">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {isOpen && <span className="ml-1">Profile</span>}
                                        </div>
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
                        {isOpen && (
                            <div className="flex flex-col">
                                {/* Fixed header */}
                                <h3 className={`text-md font-semibold uppercase tracking-wider mb-2 text-center w-full
                                    ${isDark ? 'text-gray-400' : 'text-black'}`}>
                                    Recent Quizzes:
                                </h3>
                                
                                {/* Scrollable quiz list */}
                                <div className="quiz-history-scroll space-y-1 w-full flex flex-col
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
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-sm font-bold truncate">{quiz.topic}</span>
                                                        <span className={`text-xs ${isDark ? 'text-green-500' : 'text-black'}`}>
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
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`mt-2 flex items-center justify-center p-2 rounded-lg transition-all duration-200 delay-200
                            ${isDark 
                                ? 'text-gray-400 hover:text-white hover:bg-red-600' 
                                : 'text-gray-600 hover:text-white hover:bg-black'}`}
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