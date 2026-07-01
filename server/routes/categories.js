import express from 'express';
import pool from '../utils/db.js';
import { verifyToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { categorySchemas } from '../schemas/validationSchemas.js';

const router = express.Router();

// Get all categories
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, color_code FROM categories ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category
router.post('/', verifyToken, validateRequest(categorySchemas.create), async (req, res) => {
  try {
    const { name, color_code } = req.body;

    // Check if category name exists
    const categoryExists = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (categoryExists.rows.length > 0) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, color_code) VALUES ($1, $2) RETURNING *',
      [name, color_code]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
