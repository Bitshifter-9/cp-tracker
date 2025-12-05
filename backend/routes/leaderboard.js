import express from 'express';
import UserProgress from '../models/UserProgress.js';
import Problem from '../models/Problem.js';
import Team from '../models/Team.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get leaderboard for the team
router.get('/', async (req, res) => {
    try {
        const { teamId } = req.user;

        // Get all team members
        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const leaderboard = [];

        for (const member of team.members) {
            const username = member.username;

            // Get solved problems
            const solvedProgress = await UserProgress.find({
                teamId,
                username,
                status: 'solved'
            }).populate('problemId');

            const solvedCount = solvedProgress.length;

            // Calculate weighted score
            let weightedScore = 0;
            for (const progress of solvedProgress) {
                const problem = progress.problemId;
                if (!problem) continue;

                // Assign weights based on rating/difficulty
                let weight = 1;
                const rating = problem.rating;

                if (problem.platform === 'TLE') {
                    // Codeforces ratings
                    const numRating = parseInt(rating);
                    if (!isNaN(numRating)) {
                        weight = Math.max(1, Math.floor(numRating / 100));
                    }
                } else if (problem.platform === 'USACO') {
                    // USACO difficulty
                    if (rating === 'Bronze') weight = 5;
                    else if (rating === 'Silver') weight = 10;
                    else if (rating === 'Gold') weight = 15;
                    else if (rating === 'Platinum') weight = 20;
                } else if (problem.platform === 'CSES') {
                    // CSES difficulty
                    if (rating === 'Intro') weight = 3;
                    else if (rating === 'Sorting') weight = 6;
                    else if (rating === 'DP') weight = 10;
                    else if (rating === 'Graph') weight = 12;
                }

                weightedScore += weight;
            }

            leaderboard.push({
                username,
                solvedCount,
                weightedScore
            });
        }

        // Sort by weighted score (descending), then by solved count
        leaderboard.sort((a, b) => {
            if (b.weightedScore !== a.weightedScore) {
                return b.weightedScore - a.weightedScore;
            }
            return b.solvedCount - a.solvedCount;
        });

        res.json({ leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

export default router;
