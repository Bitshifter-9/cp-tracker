import mongoose from 'mongoose';

const customSheetSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
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

export default mongoose.model('CustomSheet', customSheetSchema);
