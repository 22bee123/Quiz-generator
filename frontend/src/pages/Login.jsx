import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-100">Login</h2>
                
                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white p-3 rounded-lg font-medium
                                 hover:bg-emerald-500 transition-colors duration-200"
                    >
                        Login
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
} 