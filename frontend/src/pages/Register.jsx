import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        age: '',
        userType: 'student'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validateName = (name) => {
        if (name.length < 3) return 'Name must be at least 3 characters long';
        if (name.length > 30) return 'Name cannot exceed 30 characters';
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error when user starts typing
        setError('');
        
        // Validate name as user types
        if (name === 'username') {
            const nameError = validateName(value);
            if (nameError) {
                setError(nameError);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', formData);
            console.log('Registration response:', response.data); // Debug log
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            console.log('Stored user data:', response.data.user); // Debug log
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-100">Register</h2>
                
                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Age</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">User Type</label>
                        <select
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                            required
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white p-3 rounded-lg font-medium
                                 hover:bg-emerald-500 transition-colors duration-200"
                    >
                        Register
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
} 