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

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/vacations', vacationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

const httpServer = createServer(app);
initSocket(httpServer);

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
