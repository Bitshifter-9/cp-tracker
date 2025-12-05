import express from 'express';
import UserProgress from '../models/UserProgress.js';
import Problem from '../models/Problem.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all progress for the team
router.get('/', async (req, res) => {
    try {
        const { teamId } = req.user;
        const progress = await UserProgress.find({ teamId }).populate('problemId').sort({ updatedAt: -1 });
        res.json({ progress });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// Update user's status for a problem
router.put('/:problemId', async (req, res) => {
    try {
        const { problemId } = req.params;
        const { status } = req.body;
        const { teamId, username } = req.user;

        if (!['solved', 'todo', 'revision', 'skipped', 'none'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Check if problem exists and belongs to team
        const problem = await Problem.findOne({ _id: problemId, teamId });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Update or create progress
        let progress = await UserProgress.findOne({ teamId, username, problemId });

        if (progress) {
            progress.status = status;
            if (status === 'solved' && !progress.solvedAt) {
                progress.solvedAt = new Date();
            }
            await progress.save();
        } else {
            progress = new UserProgress({
                teamId,
                username,
                problemId,
                status,
                solvedAt: status === 'solved' ? new Date() : null
            });
            await progress.save();
        }

        res.json({ progress });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update notes for a problem
router.put('/:problemId/notes', async (req, res) => {
    try {
        const { problemId } = req.params;
        const { notes } = req.body;
        const { teamId, username } = req.user;

        const progress = await UserProgress.findOneAndUpdate(
            { teamId, username, problemId },
            { notes, updatedAt: new Date() },
            { new: true, upsert: true }
        ).populate('problemId');

        res.json({ progress });
    } catch (error) {
        console.error('Update notes error:', error);
        res.status(500).json({ error: 'Failed to update notes' });
    }
});

// Get specific user's progress
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { teamId } = req.user;

        const progress = await UserProgress.find({ teamId, username }).populate('problemId');
        res.json({ progress });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({ error: 'Failed to get user progress' });
    }
});

// Calculate user's daily streak
router.get('/streak/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { teamId } = req.user;

        // Get all solved problems sorted by date
        const solvedProblems = await UserProgress.find({
            teamId,
            username,
            status: 'solved',
            solvedAt: { $exists: true }
        }).sort({ solvedAt: -1 });

        if (solvedProblems.length === 0) {
            return res.json({ streak: 0 });
        }

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group by date
        const dateMap = new Map();
        solvedProblems.forEach(p => {
            const date = new Date(p.solvedAt);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split('T')[0];
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, true);
            }
        });

        const sortedDates = Array.from(dateMap.keys()).sort().reverse();

        // Check if solved today or yesterday
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let currentDate;
        if (sortedDates[0] === todayStr) {
            streak = 1;
            currentDate = today;
        } else if (sortedDates[0] === yesterdayStr) {
            streak = 1;
            currentDate = yesterday;
        } else {
            return res.json({ streak: 0 });
        }

        // Count consecutive days
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];

            if (sortedDates[i] === prevDateStr) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }

        res.json({ streak });
    } catch (error) {
        console.error('Get streak error:', error);
        res.status(500).json({ error: 'Failed to calculate streak' });
    }
});

export default router;
