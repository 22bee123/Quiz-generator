import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export function Sidebar({ quizHistory, onQuizSelect, onSidebarToggle }) {
    const [isOpen, setIsOpen] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get user data from localStorage when component mounts
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
        onSidebarToggle(!isOpen);
    };

    const handleQuizClick = (quiz) => {
        onQuizSelect(quiz);
        navigate('/');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const linkClass = ({ isActive }) => 
        `flex items-center mb-4 hover:bg-white/10 p-2 rounded backdrop-blur-sm transition-all duration-300 ${isActive ? 'bg-white/20' : ''}`;

    return (
        <div 
            className={`fixed left-0 top-0 h-full transition-all duration-300 
                bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-md
                border-r border-white/10 shadow-lg
                ${isOpen ? 'w-64' : 'w-16'}`}
        >
            <div className="p-4">
                {/* User Profile Section */}
                <div className="mb-8 text-center relative">
                    {/* Toggle Button integrated into header */}
                    <button 
                        onClick={toggleSidebar}
                        className="absolute -right-2 top-2 text-white/60 hover:text-white/90 transition-colors duration-200"
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
                            <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden backdrop-blur-sm bg-white/10 border border-white/20 shadow-xl">
                                {/* User Avatar placeholder */}
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-80"></div>
                            </div>
                            <div className="text-white/90">
                                <h3 className="font-bold">{user?.username || 'Guest'}</h3>
                                <p className="text-sm text-white/60">{user?.email || 'Not logged in'}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="mb-8">
                    <NavLink to="/" className={linkClass} end>
                        <svg className="w-6 h-6 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {isOpen && <span className="text-white/90">Quiz Generator</span>}
                    </NavLink>

                    <NavLink to="/profile" className={linkClass}>
                        <svg className="w-6 h-6 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {isOpen && <span className="text-white/90">Profile</span>}
                    </NavLink>
                </nav>

                {/* Quiz History Section */}
                {isOpen && (
                    <div className="mb-8">
                        <h4 className="font-bold mb-2 text-white/90">Recent Quizzes</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {quizHistory?.map((quiz, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => handleQuizClick(quiz)}
                                    className="p-2 rounded text-sm cursor-pointer
                                        backdrop-blur-sm bg-white/5 hover:bg-white/10
                                        border border-white/10 transition-all duration-300"
                                >
                                    <p className="font-bold truncate text-white/90">{quiz.topic}</p>
                                    <p className="text-xs text-white/60">
                                        {new Date(quiz.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="flex items-center w-full p-2 rounded
                        backdrop-blur-sm bg-white/5 hover:bg-red-500/20
                        border border-white/10 transition-all duration-300"
                >
                    <svg className="w-6 h-6 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {isOpen && <span className="text-white/90">Logout</span>}
                </button>
            </div>
        </div>
    );
} 