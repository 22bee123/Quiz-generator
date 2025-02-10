import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setUser(response.data);
            } catch (error) {
                setError(error.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Theme toggle button */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 p-2 rounded-full 
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

            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl rounded-lg overflow-hidden`}>
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-10 text-white">
                        <div className="flex items-center space-x-4">
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{user?.name}</h1>
                                <p className="text-white/80">{user?.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                                    {user?.userType === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Information */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        User Information
                                    </h2>
                                    <div className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} rounded-lg p-4 space-y-4`}>
                                        <div>
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Name</label>
                                            <p className={`mt-1 text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                                            <p className={`mt-1 text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Age</label>
                                            <p className={`mt-1 text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.age} years old</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Account Details
                                    </h2>
                                    <div className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} rounded-lg p-4 space-y-4`}>
                                        <div>
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Account Type</label>
                                            <p className={`mt-1 text-lg capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.userType}</p>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Member Since</label>
                                            <p className={`mt-1 text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Not available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                onClick={() => navigate('/')}
                                className={`px-4 py-2 border rounded-md transition-colors
                                    ${isDark 
                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 