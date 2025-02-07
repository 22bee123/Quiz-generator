import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    question: String,

    options: {
        A: String,
        B: String,
        C: String,
        D: String
    },
    correctAnswer: String
});

const QuizSchema = new mongoose.Schema({
    topic: String,
    questions: [QuestionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const QuizModel = mongoose.model('Quiz', QuizSchema);

export default QuizModel;
