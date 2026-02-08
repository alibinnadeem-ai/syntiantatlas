import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { User, Property } from '../models/index.js';

const router = express.Router();

// Super Admin only routes
router.get('/users', authenticateToken, authorize('super_admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const users = role ? await User.findByRole(role) : await User.findByRole('investor');
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/properties/pending', authenticateToken, authorize('super_admin'), async (req, res) => {
  try {
    const properties = await Property.findAll({ status: 'pending' });
    res.json({ properties, count: properties.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/properties/:id/approve', authenticateToken, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProperty = await Property.update(id, { status: 'active' });
    res.json({ message: 'Property approved', property: updatedProperty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
