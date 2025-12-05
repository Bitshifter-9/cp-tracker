import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        index: true
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['solved', 'todo', 'revision', 'skipped', 'none'],
        default: 'none'
    },
    solvedAt: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one progress entry per user per problem
userProgressSchema.index({ teamId: 1, username: 1, problemId: 1 }, { unique: true });

// Update solvedAt when status changes to solved
userProgressSchema.pre('save', function (next) {
    if (this.status === 'solved' && !this.solvedAt) {
        this.solvedAt = new Date();
    }
    next();
});

// Update updatedAt on every save
userProgressSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('UserProgress', userProgressSchema);
