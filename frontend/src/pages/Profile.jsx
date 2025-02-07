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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold mb-6">Profile</h1>
                
                <div className="space-y-4">
                    <div>
                        <label className="font-bold text-gray-700">Name:</label>
                        <p className="text-gray-600">{user.name}</p>
                    </div>

                    <div>
                        <label className="font-bold text-gray-700">Email:</label>
                        <p className="text-gray-600">{user.email}</p>
                    </div>

                    <div>
                        <label className="font-bold text-gray-700">Age:</label>
                        <p className="text-gray-600">{user.age}</p>
                    </div>

                    <div>
                        <label className="font-bold text-gray-700">User Type:</label>
                        <p className="text-gray-600 capitalize">{user.userType}</p>
                    </div>

                    <div>
                        <label className="font-bold text-gray-700">Member Since:</label>
                        <p className="text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 