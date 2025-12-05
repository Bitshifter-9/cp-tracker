import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['Codeforces', 'LeetCode', 'CodeChef', 'Other'],
        default: 'Codeforces'
    },
    date: {
        type: Date,
        required: true
    },
    link: {
        type: String,
        default: ''
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Contest', contestSchema);
