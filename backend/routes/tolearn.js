import express from 'express';
import ToLearnTopic from '../models/ToLearnTopic.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all topics for the user
router.get('/', async (req, res) => {
    try {
        const { teamId, username } = req.user;
        const topics = await ToLearnTopic.find({ teamId, username }).sort({ createdAt: -1 });
        res.json({ topics });
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ error: 'Failed to get topics' });
    }
});

// Create new topic
router.post('/', async (req, res) => {
    try {
        const { topic, description, priority, resources } = req.body;
        const { teamId, username } = req.user;

        if (!topic || topic.trim().length === 0) {
            return res.status(400).json({ error: 'Topic name is required' });
        }

        const newTopic = new ToLearnTopic({
            teamId,
            username,
            topic: topic.trim(),
            description: description?.trim() || '',
            priority: priority || 'medium',
            resources: resources || [],
            status: 'not-started'
        });

        await newTopic.save();
        res.json({ topic: newTopic });
    } catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json({ error: 'Failed to create topic' });
    }
});

// Update topic
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, description, priority, resources, status } = req.body;
        const { teamId, username } = req.user;

        const existingTopic = await ToLearnTopic.findOne({ _id: id, teamId, username });
        if (!existingTopic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        if (topic !== undefined) existingTopic.topic = topic.trim();
        if (description !== undefined) existingTopic.description = description.trim();
        if (priority !== undefined) existingTopic.priority = priority;
        if (resources !== undefined) existingTopic.resources = resources;
        if (status !== undefined) existingTopic.status = status;

        await existingTopic.save();
        res.json({ topic: existingTopic });
    } catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json({ error: 'Failed to update topic' });
    }
});

// Update topic status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { teamId, username } = req.user;

        if (!['not-started', 'learning', 'completed', 'on-hold'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const topic = await ToLearnTopic.findOne({ _id: id, teamId, username });
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        topic.status = status;
        await topic.save();
        res.json({ topic });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Delete topic
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { teamId, username } = req.user;

        const result = await ToLearnTopic.deleteOne({ _id: id, teamId, username });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Delete topic error:', error);
        res.status(500).json({ error: 'Failed to delete topic' });
    }
});

export default router;
