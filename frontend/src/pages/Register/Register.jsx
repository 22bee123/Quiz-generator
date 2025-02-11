import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from "../../context/ThemeContext";
import ParticlesComponent from '../../components/Particles/Particles';

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                email,
                password
            });

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isDark ? 'dark' : ''}`}>
            <div className="absolute inset-0 z-0">
                <ParticlesComponent id="tsparticles-register" />
            </div>

            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 z-50 p-2 rounded-full 
                         bg-white/10 backdrop-blur-lg border border-white/20 
                         hover:bg-white/20 transition-colors duration-200
                         shadow-lg"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>

            <div className={`relative z-10 w-full max-w-md p-8 mx-4 
                          ${isDark 
                              ? 'bg-[#262626]/80 text-white' 
                              : 'bg-[#ddddd5]/80 text-black'} 
                          backdrop-blur-lg rounded-xl shadow-2xl transition-colors duration-200`}>
                <div className={`absolute inset-0 rounded-xl ${
                    isDark
                        ? 'bg-[#262626] opacity-90'
                        : 'bg-[#ddddd5] opacity-90'
                }`}></div>
                <div className="relative z-10">
                    <h2 className={`text-3xl font-bold mb-2 text-center ${isDark ? 'text-[#ddddd5]' : 'text-[#262626]'}`}>Create Account</h2>
                    <p className={`text-center text-gray-500 mb-6 ${isDark ? 'text-[#ddddd5]' : 'text-[#262626]'}`}>Register to get started</p>
                    
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
                                             : 'bg-[#ddddd5] border-gray-400 text-black placeholder-gray-500'}
                                         border focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
                                             : 'bg-[#ddddd5] border-gray-400 text-black placeholder-gray-500'}
                                         border focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
                            Register
                        </button>
                    </form>

                    <p className={`text-center mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-500 hover:text-blue-600">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}