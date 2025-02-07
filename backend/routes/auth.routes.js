import express from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../model/user.model.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { name, email, password, age, userType } = req.body;

        if (!name || !email || !password || !age || !userType) {
            return res.status(400).json({ 
                error: 'All fields are required',
                received: { name, email, password: '***', age, userType }
            });
        }

        // Check if user exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new UserModel({
            name,
            email,
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
                name: user.name,
                email: user.email,
                age: user.age,
                userType: user.userType
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
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
                name: user.name,
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