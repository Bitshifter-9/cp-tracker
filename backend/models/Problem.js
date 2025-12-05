import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    rating: {
        type: String, // Can be "800", "Gold", "Hard", etc.
        default: 'N/A'
    },
    platform: {
        type: String,
        enum: ['TLE', 'USACO', 'CSES', 'Custom'],
        required: true
    },
    sheet: {
        type: String, // 'TLE', 'USACO', 'CSES', or custom sheet ID
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient querying
problemSchema.index({ teamId: 1, sheet: 1, rating: 1, order: 1 });

export default mongoose.model('Problem', problemSchema);
