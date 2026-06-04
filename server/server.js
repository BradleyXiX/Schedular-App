import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/test.js';
import authRoutes from './routes/auth.js';
import schedulesRoutes from './routes/schedules.js';
import { initializeDatabase } from './utils/initDb.js';

dotenv.config();
const app = express();

// Initialize database on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

//Middleware 
app.use(cors());
app.use(express.json());

//Routes
app.get('/', (req, res) => res.send('API is running'));
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', schedulesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
