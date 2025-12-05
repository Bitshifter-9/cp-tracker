import mongoose from 'mongoose';

const toLearnTopicSchema = new mongoose.Schema({
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
    topic: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['not-started', 'learning', 'completed', 'on-hold'],
        default: 'not-started'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    resources: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
toLearnTopicSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
toLearnTopicSchema.index({ teamId: 1, username: 1 });

export default mongoose.model('ToLearnTopic', toLearnTopicSchema);
