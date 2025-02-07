import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Drop existing indexes before creating new schema
const dropIndexes = async () => {
    try {
        await mongoose.connection.collection('users').dropIndexes();
    } catch (error) {
        console.log('No indexes to drop');
    }
};

dropIndexes();

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    userType: {
        type: String,
        enum: ['student', 'teacher'],
        required: true
    },
    quizzes: [{
        topic: String,
        questions: [{
            question: String,
            options: [String],
            correctAnswer: String
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove any existing model to prevent duplicate model error
mongoose.models = {};

const UserModel = mongoose.model('User', UserSchema);
export default UserModel; 