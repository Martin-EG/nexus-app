import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv({ path: '.env.local' });

/**
 * Standalone DataSource used only by the TypeORM CLI (migrations).
 *
 * It connects via DIRECT_URL — the non-pooled Supabase connection (port 5432).
 * Supabase recommends the direct connection for DDL/migrations; the pooled
 * DATABASE_URL (PgBouncer, port 6543) is for the running app.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
