import express from 'express';
import CustomSheet from '../models/CustomSheet.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all custom sheets for team
router.get('/custom', async (req, res) => {
    try {
        const { teamId } = req.user;
        const sheets = await CustomSheet.find({ teamId }).sort({ createdAt: 1 });
        res.json({ sheets });
    } catch (error) {
        console.error('Get custom sheets error:', error);
        res.status(500).json({ error: 'Failed to get custom sheets' });
    }
});

// Create a new custom sheet
router.post('/custom', async (req, res) => {
    try {
        const { name } = req.body;
        const { teamId, username } = req.user;

        if (!name) {
            return res.status(400).json({ error: 'Sheet name required' });
        }

        const sheet = new CustomSheet({
            teamId,
            name,
            createdBy: username
        });

        await sheet.save();
        res.json({ sheet });
    } catch (error) {
        console.error('Create custom sheet error:', error);
        res.status(500).json({ error: 'Failed to create custom sheet' });
    }
});

// Rename a custom sheet
router.put('/custom/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const { teamId } = req.user;

        if (!name) {
            return res.status(400).json({ error: 'Sheet name required' });
        }

        const sheet = await CustomSheet.findOne({ _id: id, teamId });
        if (!sheet) {
            return res.status(404).json({ error: 'Sheet not found' });
        }

        sheet.name = name;
        await sheet.save();

        res.json({ sheet });
    } catch (error) {
        console.error('Rename custom sheet error:', error);
        res.status(500).json({ error: 'Failed to rename custom sheet' });
    }
});

// Delete a custom sheet
router.delete('/custom/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { teamId } = req.user;

        const sheet = await CustomSheet.findOneAndDelete({ _id: id, teamId });
        if (!sheet) {
            return res.status(404).json({ error: 'Sheet not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete custom sheet error:', error);
        res.status(500).json({ error: 'Failed to delete custom sheet' });
    }
});

export default router;
