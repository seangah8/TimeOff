import 'reflect-metadata';
import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './api/routes/auth';
import vacationRoutes from './api/routes/vacations';
import { initSocket } from './socket';

const app = express();

// Allow requests from the frontend dev server and include cookies in cross-origin requests.
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
// cookieParser makes req.cookies available so the auth middleware can read the JWT.
app.use(cookieParser());

// Simple health check endpoint — useful for verifying the server is up.
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/vacations', vacationRoutes);

// Global error handler must be registered AFTER all routes so it can catch
// errors forwarded by next(err) from any route handler.
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

// We need a raw http.Server (not just Express) because Socket.io attaches to it directly.
const httpServer = createServer(app);
initSocket(httpServer);

// Connect to the database first, then start listening for requests.
// If the DB connection fails we exit immediately — running without a DB is useless.
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
