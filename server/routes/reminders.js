import express from 'express';
import pool from '../utils/db.js';
import { verifyToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { reminderSchemas } from '../schemas/validationSchemas.js';

const router = express.Router();

// Get all reminders for user's schedules
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.schedule_id, r.remind_at, r.method, s.title AS schedule_title
       FROM reminders r
       JOIN schedules s ON r.schedule_id = s.id
       WHERE s.user_id = $1
       ORDER BY r.remind_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reminder
router.post('/', verifyToken, validateRequest(reminderSchemas.create), async (req, res) => {
  try {
    const { schedule_id, remind_at, method } = req.body;

    // Verify schedule belongs to user
    const scheduleResult = await pool.query(
      'SELECT id FROM schedules WHERE id = $1 AND user_id = $2',
      [schedule_id, req.user.id]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to add a reminder to this schedule' });
    }

    const result = await pool.query(
      'INSERT INTO reminders (schedule_id, remind_at, method) VALUES ($1, $2, $3) RETURNING *',
      [schedule_id, remind_at, method]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete reminder
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Verify reminder belongs to user's schedule
    const reminderResult = await pool.query(
      `SELECT r.id FROM reminders r
       JOIN schedules s ON r.schedule_id = s.id
       WHERE r.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (reminderResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this reminder' });
    }

    await pool.query('DELETE FROM reminders WHERE id = $1', [req.params.id]);

    res.json({ message: 'Reminder deleted successfully', id: parseInt(req.params.id, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
