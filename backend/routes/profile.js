import express from 'express';
import Team from '../models/Team.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Update user profile (username/password)
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { username: newUsername, password: newPassword } = req.body;
        const { teamId, username: currentUsername } = req.user;

        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const memberIndex = team.members.findIndex(m => m.username === currentUsername);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'User not found in team' });
        }

        // Check if new username is already taken (if changing username)
        if (newUsername && newUsername !== currentUsername) {
            const usernameExists = team.members.some(m => m.username === newUsername);
            if (usernameExists) {
                return res.status(400).json({ error: 'Username already taken in this team' });
            }
            team.members[memberIndex].username = newUsername;
        }

        // Update password if provided
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            team.members[memberIndex].password = hashedPassword;
        }

        await team.save();

        // Generate new token with updated username
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { teamId, username: newUsername || currentUsername },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            username: newUsername || currentUsername,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update team name
router.put('/team-name', authenticateToken, async (req, res) => {
    try {
        const { teamName } = req.body;
        const { teamId } = req.user;

        if (!teamName || teamName.trim().length === 0) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        team.teamName = teamName.trim();
        await team.save();

        res.json({
            teamName: team.teamName,
            message: 'Team name updated successfully'
        });
    } catch (error) {
        console.error('Team name update error:', error);
        res.status(500).json({ error: 'Failed to update team name' });
    }
});

// Get team info (including team name)
router.get('/team-info', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.user;

        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({
            teamId: team.teamId,
            teamName: team.teamName || `Team ${team.teamId}`,
            memberCount: team.members.length
        });
    } catch (error) {
        console.error('Team info error:', error);
        res.status(500).json({ error: 'Failed to get team info' });
    }
});

export default router;
