import pool from './db.js';

export const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color_code VARCHAR(7) NOT NULL
      );
    `);

    // Create schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add additional fields to schedules for categories and recurrence
    await pool.query(`
      ALTER TABLE schedules ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id) ON DELETE SET NULL;
      ALTER TABLE schedules ADD COLUMN IF NOT EXISTS location VARCHAR(255);
      ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
    `);

    // Create recurrence rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recurrence_rules (
        id SERIAL PRIMARY KEY,
        schedule_id INT NOT NULL UNIQUE REFERENCES schedules(id) ON DELETE CASCADE,
        frequency VARCHAR(20) NOT NULL,
        interval INT DEFAULT 1,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reminders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        schedule_id INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
        remind_at TIMESTAMP NOT NULL,
        method VARCHAR(20) NOT NULL DEFAULT 'popup',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
      CREATE INDEX IF NOT EXISTS idx_reminders_schedule_id ON reminders(schedule_id);
    `);

    // Seed default categories
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesCount.rows[0].count, 10) === 0) {
      const defaultCategories = [
        ['Class', '#3b82f6'],
        ['Meeting', '#10b981'],
        ['Task', '#f59e0b'],
        ['Personal', '#8b5cf6']
      ];
      for (const [name, color] of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (name, color_code) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [name, color]
        );
      }
      console.log('🌱 Seeded default categories');
    }

    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  }
};
