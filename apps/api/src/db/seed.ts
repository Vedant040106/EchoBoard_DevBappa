import { fileURLToPath } from 'url';
import { pool, query } from './index.js';
import { config } from '../config/index.js';
import { hashPassword } from '../security/hasher.js';
import { logger } from '../utils/logger.js';

export async function seedInitialAdmin(): Promise<void> {
  const adminId = config.adminInitialId;
  const rawPassword = config.adminInitialPassword;

  const { rows } = await query('SELECT id FROM admin_users WHERE username = $1', [adminId]);

  if (rows.length > 0) {
    logger.info({ adminId }, 'Admin user already exists, skipping initial seed');
    return;
  }

  logger.info({ adminId }, 'Seeding initial admin user...');
  const passwordHash = await hashPassword(rawPassword);

  await query(
    `INSERT INTO admin_users (id, username, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [adminId, adminId, passwordHash]
  );

  logger.info({ adminId }, 'Initial admin user seeded successfully');
}

// Allow direct execution via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedInitialAdmin()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Admin seed failed');
      await pool.end();
      process.exit(1);
    });
}
