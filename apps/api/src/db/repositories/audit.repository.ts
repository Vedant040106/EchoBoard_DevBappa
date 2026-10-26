import type pg from 'pg';
import { query } from '../index.js';
import type { AuditEventItem, PaginatedData } from '@devbappa/shared';

export interface CreateAuditParams {
  adminId: string;
  feedbackId?: string | null;
  eventId?: string | null;
  action: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  correlationId?: string | null;
}

export class AuditRepository {
  static async recordEvent(params: CreateAuditParams, client?: pg.PoolClient): Promise<string> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      INSERT INTO audit_events (
        admin_id,
        feedback_id,
        event_id,
        action,
        previous_state,
        new_state,
        timestamp,
        correlation_id
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING id
    `;
    const { rows } = await q(sql, [
      params.adminId,
      params.feedbackId || null,
      params.eventId || null,
      params.action,
      JSON.stringify(params.previousState || null),
      JSON.stringify(params.newState || null),
      params.correlationId || null,
    ]);
    return rows[0].id;
  }

  static async getEvents(options: {
    feedbackId?: string;
    eventId?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedData<AuditEventItem>> {
    const { feedbackId, eventId, page, limit } = options;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (feedbackId) {
      whereClauses.push(`feedback_id = $${paramIndex++}`);
      values.push(feedbackId);
    }

    if (eventId) {
      whereClauses.push(`event_id = $${paramIndex++}`);
      values.push(eventId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM audit_events ${whereSql}`;
    const { rows: countRows } = await query<{ total: number }>(countSql, values);
    const total = countRows[0]?.total ?? 0;

    const dataSql = `
      SELECT id, admin_id, feedback_id, event_id, action, previous_state, new_state, timestamp, correlation_id
      FROM audit_events
      ${whereSql}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const { rows } = await query(dataSql, [...values, limit, offset]);

    const items: AuditEventItem[] = rows.map((r) => ({
      id: r.id,
      adminId: r.admin_id,
      feedbackId: r.feedback_id,
      eventId: r.event_id,
      action: r.action,
      previousState: r.previous_state,
      newState: r.new_state,
      timestamp: r.timestamp.toISOString(),
      correlationId: r.correlation_id,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
