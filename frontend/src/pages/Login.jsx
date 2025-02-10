import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import Particles from '../components/Particles'
import { useTheme } from '../context/ThemeContext';


export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Attempting login with:', { email }); // Debug log

            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            console.log('Login response:', response.data); // Debug log

            const { token, user } = response.data;
            
            // Store complete user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('Stored in localStorage:', {
                token,
                user: JSON.parse(localStorage.getItem('user'))
            }); // Debug log
            
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isDark ? 'dark' : ''}`}>
            {/* Theme toggle button */}
            <button
                onClick={toggleTheme}

                className="absolute top-4 right-4 z-50 p-2 rounded-full 
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

            {/* Background with theme colors */}
            <div className="absolute inset-0 transition-colors duration-200"
                 style={{ 
                     background: isDark 
                         ? 'linear-gradient(135deg, #000a14 0%, #000f1f 40%, #004d40 100%)'
                         : 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 40%, #e6fff7 100%)'
                 }}>
                {/* Enhanced gradient layers with hues */}
                <div className="absolute inset-0">
                    {/* Luminous overlay */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at 50% 50%, rgba(0, 77, 64, 0.15) 0%, transparent 60%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at 80% 20%, rgba(0, 150, 136, 0.1) 0%, transparent 40%)',
                        }}
                    />
                </div>

                {/* Distorted gradient layers with highlights */}
                <div className="absolute inset-0">
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(45deg, transparent 0%, rgba(0, 18, 32, 0.8) 50%, transparent 100%)',
                            transform: 'skewY(-12deg)',
                        }}
                    />
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(-45deg, transparent 0%, rgba(0, 53, 45, 0.8) 50%, transparent 100%)',
                            transform: 'skewY(12deg)',
                        }}
                    />
                </div>

                {/* Dynamic light effects with enhanced glow */}
                <div className="absolute inset-0">
                    <div 
                        className="absolute top-0 right-0 w-1/2 h-full opacity-40"
                        style={{
                            background: 'linear-gradient(135deg, transparent, rgba(0, 77, 64, 0.3))',
                            transform: 'skewX(-20deg) translateX(50%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    <div 
                        className="absolute -top-1/2 -right-1/2 w-full h-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(0, 150, 136, 0.2) 0%, transparent 60%)',
                            filter: 'blur(80px)',
                        }}
                    />
                    <div 
                        className="absolute -bottom-1/2 -left-1/2 w-full h-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(0, 15, 31, 0.3) 0%, transparent 60%)',
                            filter: 'blur(80px)',
                        }}
                    />
                </div>

                {/* Glowing orbs with enhanced luminosity */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 opacity-30 animate-pulse-slower"
                         style={{
                             background: 'radial-gradient(circle, rgba(0, 150, 136, 0.3) 0%, transparent 70%)',
                             filter: 'blur(50px)',
                             transform: 'skew(-10deg, 10deg)',
                         }}
                    />
                    <div className="absolute bottom-1/3 left-1/3 w-96 h-96 opacity-30 animate-pulse-slow"
                         style={{
                             background: 'radial-gradient(circle, rgba(0, 77, 64, 0.3) 0%, transparent 70%)',
                             filter: 'blur(50px)',
                             transform: 'skew(10deg, -10deg)',
                         }}
                    />
                </div>

                {/* Ambient light particles with enhanced glow */}
                <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: `${Math.random() * 4 + 1}px`,
                                height: `${Math.random() * 4 + 1}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                background: i % 3 === 0 
                                    ? 'rgba(0, 150, 136, 0.6)' 
                                    : i % 3 === 1 
                                        ? 'rgba(0, 77, 64, 0.6)'
                                        : 'rgba(0, 15, 31, 0.6)',
                                boxShadow: i % 3 === 0 
                                    ? '0 0 15px rgba(0, 150, 136, 0.8)' 
                                    : i % 3 === 1
                                        ? '0 0 15px rgba(0, 77, 64, 0.8)'
                                        : '0 0 15px rgba(0, 15, 31, 0.8)',
                                filter: 'blur(1px)'
                            }}
                            
                        />
                    ))}
                </div>

                {/* Highlight streaks */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={`highlight-${i}`}
                            className="absolute opacity-20"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: '150px',
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent, rgba(0, 150, 136, 0.8), transparent)',
                                transform: `rotate(${Math.random() * 360}deg)`,
                                filter: 'blur(2px)',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Login/Register container with enhanced glass effect */}
            <div className={`relative z-10 w-full max-w-md p-8 mx-4 
                          ${isDark 
                              ? 'bg-gray-900/80 text-white' 
                              : 'bg-white/80 text-black'} 
                          backdrop-blur-lg rounded-xl shadow-2xl transition-colors duration-200`}>
                <div className={`absolute inset-0 rounded-xl ${
                    isDark
                        ? 'bg-gradient-to-r from-gray-900 to-gray-800 opacity-90'
                        : 'bg-gradient-to-r from-white to-gray-50 opacity-90'
                }`}></div>
                <div className="relative z-10">
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Login</h2>
                    
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className={`block font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-3 py-2 rounded-md 
                                         ${isDark 
                                             ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                                             : 'bg-white border-gray-300 text-black placeholder-gray-500'}
                                         border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className={`block font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-3 py-2 rounded-md 
                                         ${isDark 
                                             ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                                             : 'bg-white border-gray-300 text-black placeholder-gray-500'}
                                         border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-2 rounded-md transition-colors duration-200
                                    ${isDark 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-blue-500 hover:bg-blue-600'}
                                    text-white`}
                        >
                            Login
                        </button>
                    </form>

                    <p className={`text-center mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-500 hover:text-blue-600">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 