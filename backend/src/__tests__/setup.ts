import 'reflect-metadata';
import 'dotenv/config';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

beforeEach(async () => {
  await AppDataSource.query(
    'TRUNCATE TABLE vacation_requests, users RESTART IDENTITY CASCADE',
  );
});
