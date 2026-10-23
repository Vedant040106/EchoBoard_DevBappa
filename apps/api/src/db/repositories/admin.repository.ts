import { query } from '../index.js';

export interface AdminUserRecord {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminSessionRecord {
  id: string;
  admin_id: string;
  expires_at: Date;
  created_at: Date;
}

export class AdminRepository {
  static async findByUsername(username: string): Promise<AdminUserRecord | null> {
    const { rows } = await query<AdminUserRecord>(
      'SELECT id, username, password_hash, created_at, updated_at FROM admin_users WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  }

  static async findById(id: string): Promise<AdminUserRecord | null> {
    const { rows } = await query<AdminUserRecord>(
      'SELECT id, username, password_hash, created_at, updated_at FROM admin_users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async createSession(sessionId: string, adminId: string, expiresAt: Date): Promise<void> {
    await query(
      `INSERT INTO admin_sessions (id, admin_id, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [sessionId, adminId, expiresAt]
    );
  }

  static async findValidSession(sessionId: string): Promise<AdminSessionRecord | null> {
    const { rows } = await query<AdminSessionRecord>(
      `SELECT id, admin_id, expires_at, created_at
       FROM admin_sessions
       WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    return rows[0] || null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const { rowCount } = await query('DELETE FROM admin_sessions WHERE expires_at <= NOW()');
    return rowCount ?? 0;
  }
}
