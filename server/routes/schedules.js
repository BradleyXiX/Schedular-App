import express from 'express';
import pool from '../utils/db.js';
import { verifyToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { scheduleSchemas, recurrenceSchemas } from '../schemas/validationSchemas.js';
import { apiLimiter, createScheduleLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Apply rate limiting to all schedule routes
router.use(apiLimiter);

// Get all schedules for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.description, s.start_time, s.end_time, s.status, s.location, s.is_recurring, s.category_id,
              c.name AS category_name, c.color_code AS category_color,
              r.frequency AS recurrence_frequency, r.interval AS recurrence_interval, r.end_date AS recurrence_end_date
       FROM schedules s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN recurrence_rules r ON s.id = r.schedule_id
       WHERE s.user_id = $1 
       ORDER BY s.start_time DESC`,
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
      `SELECT s.id, s.title, s.description, s.start_time, s.end_time, s.status, s.location, s.is_recurring, s.category_id,
              c.name AS category_name, c.color_code AS category_color,
              r.frequency AS recurrence_frequency, r.interval AS recurrence_interval, r.end_date AS recurrence_end_date
       FROM schedules s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN recurrence_rules r ON s.id = r.schedule_id
       WHERE s.id = $1 AND s.user_id = $2`,
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
router.post('/', verifyToken, createScheduleLimiter, validateRequest(scheduleSchemas.create), async (req, res) => {
  try {
    const { title, description, start_time, end_time, category_id, location, is_recurring } = req.body;

    const result = await pool.query(
      `INSERT INTO schedules (user_id, title, description, start_time, end_time, category_id, location, is_recurring) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [req.user.id, title, description || null, start_time, end_time, category_id || null, location || null, is_recurring || false]
    );

    logActivity(req.user.id, 'schedule_created', { scheduleId: result.rows[0].id, title });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update schedule
router.put('/:id', verifyToken, validateRequest(scheduleSchemas.update), async (req, res) => {
  try {
    const { title, description, start_time, end_time, status, category_id, location, is_recurring } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM schedules WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this schedule' });
    }

    const fields = [];
    const values = [];
    let queryIndex = 1;

    const addField = (name, val) => {
      if (val !== undefined) {
        fields.push(`${name} = $${queryIndex}`);
        values.push(val);
        queryIndex++;
      }
    };

    addField('title', title);
    addField('description', description);
    addField('start_time', start_time);
    addField('end_time', end_time);
    addField('status', status);
    addField('category_id', category_id);
    addField('location', location);
    addField('is_recurring', is_recurring);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);
    const queryStr = `
      UPDATE schedules 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${queryIndex} AND user_id = $${queryIndex + 1}
      RETURNING *
    `;
    const updateResult = await pool.query(queryStr, values);

    logActivity(req.user.id, 'schedule_updated', { scheduleId: req.params.id });

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

    logActivity(req.user.id, 'schedule_deleted', { scheduleId: req.params.id });

    res.json({ message: 'Schedule deleted successfully', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recurrence: Get rule
router.get('/:id/recurrence', verifyToken, async (req, res) => {
  try {
    const scheduleResult = await pool.query(
      'SELECT id FROM schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const result = await pool.query(
      'SELECT id, frequency, interval, end_date FROM recurrence_rules WHERE schedule_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recurrence: Set/Update rule
router.post('/:id/recurrence', verifyToken, validateRequest(recurrenceSchemas.create), async (req, res) => {
  try {
    const { frequency, interval, end_date } = req.body;

    const scheduleResult = await pool.query(
      'SELECT id FROM schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const result = await pool.query(
      `INSERT INTO recurrence_rules (schedule_id, frequency, interval, end_date) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (schedule_id) DO UPDATE 
       SET frequency = EXCLUDED.frequency,
           interval = EXCLUDED.interval,
           end_date = EXCLUDED.end_date,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.params.id, frequency, interval || 1, end_date || null]
    );

    await pool.query(
      'UPDATE schedules SET is_recurring = TRUE WHERE id = $1',
      [req.params.id]
    );

    logActivity(req.user.id, 'recurrence_rule_set', { scheduleId: req.params.id, frequency });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recurrence: Delete rule
router.delete('/:id/recurrence', verifyToken, async (req, res) => {
  try {
    const scheduleResult = await pool.query(
      'SELECT id FROM schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await pool.query('DELETE FROM recurrence_rules WHERE schedule_id = $1', [req.params.id]);

    await pool.query(
      'UPDATE schedules SET is_recurring = FALSE WHERE id = $1',
      [req.params.id]
    );

    logActivity(req.user.id, 'recurrence_rule_deleted', { scheduleId: req.params.id });

    res.json({ message: 'Recurrence rule deleted successfully', schedule_id: parseInt(req.params.id, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
