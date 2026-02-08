import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

router.get('/investor-overview', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT i.id) as total_investments,
        SUM(i.amount_invested) as total_invested,
        COUNT(DISTINCT i.property_id) as properties_count
       FROM investments i
       WHERE i.investor_id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/seller-overview', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(p.id) as total_properties,
        SUM(p.funding_raised) as total_raised,
        SUM(p.funding_target) as total_target
       FROM properties p
       WHERE p.seller_id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
