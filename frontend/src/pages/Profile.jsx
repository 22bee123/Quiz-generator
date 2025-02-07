import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
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
                                    <h2 className="text-xl font-semibold mb-4 text-gray-800">User Information</h2>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Name</label>
                                            <p className="mt-1 text-lg text-gray-800">{user?.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Email</label>
                                            <p className="mt-1 text-lg text-gray-800">{user?.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Age</label>
                                            <p className="mt-1 text-lg text-gray-800">{user?.age} years old</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Details</h2>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Account Type</label>
                                            <p className="mt-1 text-lg text-gray-800 capitalize">{user?.userType}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Member Since</label>
                                            <p className="mt-1 text-lg text-gray-800">
                                                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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