import express from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../model/user.model.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { username, email, password, age, userType } = req.body;

        // Validate required fields
        if (!username || !email || !password || !age || !userType) {
            return res.status(400).json({ 
                error: 'All fields are required',
                received: { username, email, password: '***', age, userType }
            });
        }

        // Validate username format
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ 
                error: 'Username must be between 3 and 30 characters'
            });
        }

        // Check for existing username or email
        const existingUser = await UserModel.findOne({
            $or: [
                { username: username.trim().toLowerCase() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.username === username.trim().toLowerCase() 
                    ? 'Username already taken' 
                    : 'Email already registered'
            });
        }

        // Create new user with trimmed values
        const user = new UserModel({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            age: Number(age),
            userType
        });

        await user.save();
        console.log('User created successfully:', user._id);

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                age: user.age,
                userType: user.userType
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors specifically
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        res.status(500).json({ 
            error: error.message,
            details: 'Registration failed'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful for user:', user._id);

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                age: user.age,
                userType: user.userType
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Login failed'
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 