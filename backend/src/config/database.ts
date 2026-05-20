import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { VacationRequest } from '../entities/VacationRequest';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'timeoff',
  // synchronize: true automatically creates/updates tables on startup to match the entity definitions.
  // This is fine for local development but must be replaced with migrations before going to production,
  // since it can drop columns or data on destructive schema changes.
  synchronize: true,
  logging: false,
  entities: [User, VacationRequest],
});
