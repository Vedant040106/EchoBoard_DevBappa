import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const isNeonOrCloud =
  config.databaseUrlUnpooled.includes('neon.tech') ||
  config.databaseUrlUnpooled.includes('sslmode=require') ||
  config.isProduction;

const migrationPool = new pg.Pool({
  connectionString: config.databaseUrlUnpooled,
  ssl: isNeonOrCloud
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
  max: 2,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const client = await migrationPool.connect();
  try {
    logger.info('Starting database migrations (using direct unpooled connection)...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    let migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      const srcDir = path.resolve(__dirname, '../../src/db/migrations');
      if (fs.existsSync(srcDir)) {
        migrationsDir = srcDir;
      } else {
        logger.warn({ migrationsDir }, 'Migrations directory not found');
        return;
      }
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const { rows: executedRows } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations'
    );
    const executed = new Set(executedRows.map((r) => r.name));

    for (const file of files) {
      if (executed.has(file)) {
        logger.debug({ file }, 'Migration already executed, skipping');
        continue;
      }

      logger.info({ file }, 'Executing migration');
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info({ file }, 'Migration executed successfully');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ file, err }, 'Migration failed, transaction rolled back');
        throw err;
      }
    }

    logger.info('All database migrations completed successfully.');
  } finally {
    client.release();
  }
}

// Allow direct execution via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      logger.info('Migration runner finished');
      await migrationPool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Migration runner terminated with error');
      await migrationPool.end();
      process.exit(1);
    });
}
