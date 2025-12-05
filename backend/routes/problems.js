import express from 'express';
import Problem from '../models/Problem.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get problems for a specific sheet
router.get('/:sheet', async (req, res) => {
    try {
        const { sheet } = req.params;
        const { teamId } = req.user;
        const { search } = req.query;

        let query = { teamId, sheet };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const problems = await Problem.find(query).sort({ rating: 1, order: 1 });
        res.json({ problems });
    } catch (error) {
        console.error('Get problems error:', error);
        res.status(500).json({ error: 'Failed to get problems' });
    }
});

// Add a new problem
router.post('/', async (req, res) => {
    try {
        const { name, link, rating, sheet, platform } = req.body;
        const { teamId, username } = req.user;

        if (!name || !link || !sheet) {
            return res.status(400).json({ error: 'Name, link, and sheet are required' });
        }

        // Get the highest order number for this sheet and rating
        const lastProblem = await Problem.findOne({ teamId, sheet, rating: rating || 'Custom' })
            .sort({ order: -1 });

        const order = lastProblem ? lastProblem.order + 1 : 1;

        const problem = new Problem({
            teamId,
            name,
            link,
            rating: rating || 'Custom',
            platform: platform || 'Custom',
            sheet,
            order,
            createdBy: username
        });

        await problem.save();
        res.json({ problem });
    } catch (error) {
        console.error('Add problem error:', error);
        res.status(500).json({ error: 'Failed to add problem' });
    }
});

// Reorder a problem within its rating group
router.put('/:id/reorder', async (req, res) => {
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'up' or 'down'
        const { teamId } = req.user;

        const problem = await Problem.findOne({ _id: id, teamId });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Get all problems in the same sheet and rating group
        const sameRatingProblems = await Problem.find({
            teamId,
            sheet: problem.sheet,
            rating: problem.rating
        }).sort({ order: 1 });

        const currentIndex = sameRatingProblems.findIndex(p => p._id.toString() === id);

        if (direction === 'up' && currentIndex > 0) {
            // Swap with previous
            const temp = sameRatingProblems[currentIndex].order;
            sameRatingProblems[currentIndex].order = sameRatingProblems[currentIndex - 1].order;
            sameRatingProblems[currentIndex - 1].order = temp;

            await sameRatingProblems[currentIndex].save();
            await sameRatingProblems[currentIndex - 1].save();
        } else if (direction === 'down' && currentIndex < sameRatingProblems.length - 1) {
            // Swap with next
            const temp = sameRatingProblems[currentIndex].order;
            sameRatingProblems[currentIndex].order = sameRatingProblems[currentIndex + 1].order;
            sameRatingProblems[currentIndex + 1].order = temp;

            await sameRatingProblems[currentIndex].save();
            await sameRatingProblems[currentIndex + 1].save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Reorder problem error:', error);
        res.status(500).json({ error: 'Failed to reorder problem' });
    }
});

// Search problems across all sheets
router.get('/search/all', async (req, res) => {
    try {
        const { q } = req.query;
        const { teamId } = req.user;

        if (!q) {
            return res.json({ problems: [] });
        }

        const problems = await Problem.find({
            teamId,
            name: { $regex: q, $options: 'i' }
        }).limit(20);

        res.json({ problems });
    } catch (error) {
        console.error('Search problems error:', error);
        res.status(500).json({ error: 'Failed to search problems' });
    }
});

export default router;
