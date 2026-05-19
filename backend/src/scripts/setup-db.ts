import 'dotenv/config';
import { Client } from 'pg';

const dbName = process.argv[2] ?? process.env.DB_NAME ?? 'timeoff';

const client = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: 'postgres', // connect to the default db to run CREATE DATABASE
});

async function setup() {
  await client.connect();

  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (res.rowCount && res.rowCount > 0) {
    console.log(`Database "${dbName}" already exists — nothing to do.`);
  } else {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully.`);
  }

  await client.end();
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
