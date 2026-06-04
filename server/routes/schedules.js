import express from 'express';
import pool from '../utils/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all schedules for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, start_time, end_time, status FROM schedules WHERE user_id = $1 ORDER BY start_time DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single schedule
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, start_time, end_time, status FROM schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create schedule
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, start_time, end_time } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, start_time, and end_time are required' });
    }

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    const result = await pool.query(
      'INSERT INTO schedules (user_id, title, description, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, description || null, start_time, end_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update schedule
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, start_time, end_time, status } = req.body;

    const result = await pool.query(
      'SELECT user_id FROM schedules WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0 || result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this schedule' });
    }

    const updateResult = await pool.query(
      `UPDATE schedules 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           start_time = COALESCE($3, start_time), 
           end_time = COALESCE($4, end_time), 
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, start_time, end_time, status, req.params.id, req.user.id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM schedules WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
