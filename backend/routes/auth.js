import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import Team from '../models/Team.js';
import Problem from '../models/Problem.js';
import { TLE_PROBLEMS, USACO_PROBLEMS, CSES_PROBLEMS } from '../utils/seedData.js';

const router = express.Router();

// Create a new team
router.post('/create-team', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Generate unique team ID
        const teamId = nanoid(10);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create team
        const team = new Team({
            teamId,
            members: [{
                username,
                password: hashedPassword
            }]
        });

        await team.save();

        // Seed initial problems for this team
        await seedProblemsForTeam(teamId);

        // Generate JWT token
        const token = jwt.sign(
            { username, teamId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ token, teamId, username });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Join existing team
router.post('/join-team', async (req, res) => {
    try {
        const { teamId, username, password } = req.body;

        if (!teamId || !username || !password) {
            return res.status(400).json({ error: 'Team ID, username, and password required' });
        }

        // Find team
        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if username already exists in team
        const existingMember = team.members.find(m => m.username === username);
        if (existingMember) {
            return res.status(400).json({ error: 'Username already taken in this team' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add member to team
        team.members.push({ username, password: hashedPassword });
        await team.save();

        // Generate JWT token
        const token = jwt.sign(
            { username, teamId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ token, teamId, username });
    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({ error: 'Failed to join team' });
    }
});

// Login to existing team
router.post('/login', async (req, res) => {
    try {
        const { teamId, username, password } = req.body;

        if (!teamId || !username || !password) {
            return res.status(400).json({ error: 'Team ID, username, and password required' });
        }

        // Find team
        const team = await Team.findOne({ teamId });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Find member
        const member = team.members.find(m => m.username === username);
        if (!member) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, member.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { username, teamId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ token, teamId, username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get team members
router.get('/team-members', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const team = await Team.findOne({ teamId: decoded.teamId });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const members = team.members.map(m => m.username);
        res.json({ members });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({ error: 'Failed to get team members' });
    }
});

// Helper function to seed problems
async function seedProblemsForTeam(teamId) {
    const problems = [];

    // Add TLE problems
    TLE_PROBLEMS.forEach(p => {
        problems.push({
            teamId,
            name: p.name,
            link: p.link,
            rating: p.rating,
            platform: 'TLE',
            sheet: 'TLE',
            order: p.order,
            createdBy: 'system'
        });
    });

    // Add USACO problems
    USACO_PROBLEMS.forEach(p => {
        problems.push({
            teamId,
            name: p.name,
            link: p.link,
            rating: p.rating,
            platform: 'USACO',
            sheet: 'USACO',
            order: p.order,
            createdBy: 'system'
        });
    });

    // Add CSES problems
    CSES_PROBLEMS.forEach(p => {
        problems.push({
            teamId,
            name: p.name,
            link: p.link,
            rating: p.rating,
            platform: 'CSES',
            sheet: 'CSES',
            order: p.order,
            createdBy: 'system'
        });
    });

    await Problem.insertMany(problems);
}

export default router;
