import express from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../model/user.model.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { username, email, password, age, userType } = req.body;

        if (!username || !email || !password || !age || !userType) {
            return res.status(400).json({ 
                error: 'All fields are required',
                received: { username, email, password: '***', age, userType }
            });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ 
                error: 'Username must be between 3 and 30 characters'
            });
        }

        // Check if username exists
        const existingUser = await UserModel.findOne({ 
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.username === username 
                    ? 'Username already taken' 
                    : 'Email already registered' 
            });
        }

        // Create new user
        const user = new UserModel({
            username,
            email,
            password,
            age: Number(age),
            userType
        });

        await user.save();
        console.log('User created successfully:', user._id);

        const userData = {
            id: user._id,
            name: user.username,
            email: user.email,
            age: user.age,
            userType: user.userType
        };

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: userData
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
        const { email, password } = req.body;
        
        const user = await UserModel.findOne({ email });
        console.log('Found user during login:', user); // Debug log

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userData = {
            id: user._id,
            name: user.username,
            email: user.email,
            age: user.age,
            userType: user.userType
        };

        console.log('Sending login response:', { token, user: userData }); // Debug log
        res.json({
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
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
        console.log('Decoded token:', decoded); // Debug log

        const user = await UserModel.findById(decoded.userId);
        console.log('Found user:', user); // Debug log

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = {
            id: user._id,
            name: user.username,
            email: user.email,
            age: user.age,
            userType: user.userType
        };

        console.log('Sending user data:', userData); // Debug log
        res.json(userData);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password if trying to change password
        if (req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ error: 'Current password is required' });
            }
            const isValidPassword = await user.comparePassword(req.body.currentPassword);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            user.password = req.body.newPassword;
        }

        // Update other fields
        if (req.body.name) user.username = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.age) user.age = req.body.age;

        await user.save();

        // Send updated user data
        res.json({
            id: user._id,
            name: user.username,
            email: user.email,
            age: user.age,
            userType: user.userType
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router; 