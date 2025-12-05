import express from 'express';
import Contest from '../models/Contest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all contests for team
router.get('/', async (req, res) => {
    try {
        const { teamId } = req.user;
        const contests = await Contest.find({ teamId }).sort({ date: 1 });
        res.json({ contests });
    } catch (error) {
        console.error('Get contests error:', error);
        res.status(500).json({ error: 'Failed to get contests' });
    }
});

// Add a new contest
router.post('/', async (req, res) => {
    try {
        const { name, date, link } = req.body;
        const { teamId, username } = req.user;

        if (!name || !date) {
            return res.status(400).json({ error: 'Contest name and date required' });
        }

        const contest = new Contest({
            teamId,
            name,
            date: new Date(date),
            link: link || '',
            createdBy: username
        });

        await contest.save();
        res.json({ contest });
    } catch (error) {
        console.error('Add contest error:', error);
        res.status(500).json({ error: 'Failed to add contest' });
    }
});

// Delete a contest
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { teamId } = req.user;

        const contest = await Contest.findOneAndDelete({ _id: id, teamId });
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete contest error:', error);
        res.status(500).json({ error: 'Failed to delete contest' });
    }
});

export default router;
