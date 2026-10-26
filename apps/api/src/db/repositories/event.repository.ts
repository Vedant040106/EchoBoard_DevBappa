import type pg from 'pg';
import { query, withTransaction } from '../index.js';
import type {
  PublicEvent,
  AdminEventItem,
  CreateEventInput,
  UpdateEventInput,
} from '@devbappa/shared';

function formatDate(dateVal: unknown): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    return dateVal.slice(0, 10);
  }
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(dateVal).slice(0, 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class EventRepository {
  /**
   * Returns public events: those currently displayed on wall, and those accepting feedback.
   */
  static async getPublicEvents(): Promise<{
    wallEvents: PublicEvent[];
    activeSubmissionEvents: PublicEvent[];
  }> {
    const wallSql = `
      SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
      FROM events
      WHERE is_displayed_on_wall = true
      ORDER BY event_date DESC, created_at DESC
    `;

    const subSql = `
      SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
      FROM events
      WHERE is_accepting_feedback = true
      ORDER BY event_date DESC, created_at DESC
    `;

    const [wallRes, subRes] = await Promise.all([query(wallSql), query(subSql)]);

    const wallEvents: PublicEvent[] = wallRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
    }));

    const activeSubmissionEvents: PublicEvent[] = subRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
    }));

    return { wallEvents, activeSubmissionEvents };
  }

  static async getActiveWallEvents(client?: pg.PoolClient): Promise<PublicEvent[]> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
      FROM events
      WHERE is_displayed_on_wall = true
      ORDER BY event_date DESC, created_at DESC
    `;
    const { rows } = await q(sql);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
    }));
  }

  static async getEventById(id: string, client?: pg.PoolClient): Promise<PublicEvent | null> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
      FROM events
      WHERE id = $1
    `;
    const { rows } = await q(sql, [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
    };
  }

  /**
   * If exactly one event is currently open for submission, returns it.
   * If multiple or none are open, returns null.
   */
  static async getPrimaryActiveSubmissionEvent(client?: pg.PoolClient): Promise<PublicEvent | null> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
      FROM events
      WHERE is_accepting_feedback = true
      ORDER BY event_date DESC, created_at DESC
    `;
    const { rows } = await q(sql);
    if (rows.length === 1) {
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        eventDate: formatDate(r.event_date),
        venue: r.venue,
        description: r.description,
        isDisplayedOnWall: r.is_displayed_on_wall,
        isAcceptingFeedback: r.is_accepting_feedback,
      };
    }
    return null;
  }

  /**
   * Admin: List all events with aggregated submission counts and average ratings.
   */
  static async getAllAdminEvents(): Promise<AdminEventItem[]> {
    const sql = `
      SELECT
        e.id,
        e.name,
        e.slug,
        e.event_date,
        e.venue,
        e.description,
        e.is_displayed_on_wall,
        e.is_accepting_feedback,
        e.created_at,
        e.updated_at,
        COUNT(CASE WHEN f.deleted_at IS NULL THEN 1 END)::int AS total_submissions,
        COUNT(CASE WHEN f.deleted_at IS NULL AND f.visibility_status = 'visible' THEN 1 END)::int AS visible_count,
        COUNT(CASE WHEN f.deleted_at IS NULL AND f.visibility_status = 'hidden' THEN 1 END)::int AS hidden_count,
        COUNT(CASE WHEN f.deleted_at IS NOT NULL THEN 1 END)::int AS deleted_count,
        ROUND(COALESCE(AVG(CASE WHEN f.deleted_at IS NULL THEN f.rating END), 5.0)::numeric, 1)::float AS average_rating
      FROM events e
      LEFT JOIN feedback f ON f.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date DESC, e.created_at DESC
    `;

    const { rows } = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
      totalSubmissions: r.total_submissions,
      visibleCount: r.visible_count,
      hiddenCount: r.hidden_count,
      deletedCount: r.deleted_count,
      averageRating: r.average_rating,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  /**
   * Admin: Create a new event with auto-generated slug.
   */
  static async createEvent(
    input: CreateEventInput,
    client?: pg.PoolClient
  ): Promise<AdminEventItem> {
    const q = client ? client.query.bind(client) : query;

    // Generate unique slug
    let baseSlug = `${slugify(input.name)}-${input.eventDate}`;
    if (!baseSlug) baseSlug = `event-${input.eventDate}`;

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await q(`SELECT id FROM events WHERE slug = $1`, [slug]);
      if (existing.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const sql = `
      INSERT INTO events (
        name,
        slug,
        event_date,
        venue,
        description,
        is_displayed_on_wall,
        is_accepting_feedback
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, slug, event_date, venue, description,
                is_displayed_on_wall, is_accepting_feedback, created_at, updated_at
    `;

    const { rows } = await q(sql, [
      input.name,
      slug,
      input.eventDate,
      input.venue,
      input.description || null,
      input.isDisplayedOnWall ?? true,
      input.isAcceptingFeedback ?? true,
    ]);

    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
      totalSubmissions: 0,
      visibleCount: 0,
      hiddenCount: 0,
      deletedCount: 0,
      averageRating: 5.0,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  /**
   * Admin: Update event details or status flags.
   */
  static async updateEvent(
    id: string,
    input: UpdateEventInput,
    client?: pg.PoolClient
  ): Promise<AdminEventItem | null> {
    const q = client ? client.query.bind(client) : query;

    const fields: string[] = [];
    const values: unknown[] = [id];
    let paramIndex = 2;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.eventDate !== undefined) {
      fields.push(`event_date = $${paramIndex++}`);
      values.push(input.eventDate);
    }
    if (input.venue !== undefined) {
      fields.push(`venue = $${paramIndex++}`);
      values.push(input.venue);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(input.description || null);
    }
    if (input.isDisplayedOnWall !== undefined) {
      fields.push(`is_displayed_on_wall = $${paramIndex++}`);
      values.push(input.isDisplayedOnWall);
    }
    if (input.isAcceptingFeedback !== undefined) {
      fields.push(`is_accepting_feedback = $${paramIndex++}`);
      values.push(input.isAcceptingFeedback);
    }

    if (fields.length === 0) {
      return this.getAdminEventById(id, client);
    }

    fields.push('updated_at = NOW()');

    const sql = `
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await q(sql, values);
    if (rows.length === 0) return null;

    return this.getAdminEventById(id, client);
  }

  static async getAdminEventById(id: string, client?: pg.PoolClient): Promise<AdminEventItem | null> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT
        e.id,
        e.name,
        e.slug,
        e.event_date,
        e.venue,
        e.description,
        e.is_displayed_on_wall,
        e.is_accepting_feedback,
        e.created_at,
        e.updated_at,
        COUNT(CASE WHEN f.deleted_at IS NULL THEN 1 END)::int AS total_submissions,
        COUNT(CASE WHEN f.deleted_at IS NULL AND f.visibility_status = 'visible' THEN 1 END)::int AS visible_count,
        COUNT(CASE WHEN f.deleted_at IS NULL AND f.visibility_status = 'hidden' THEN 1 END)::int AS hidden_count,
        COUNT(CASE WHEN f.deleted_at IS NOT NULL THEN 1 END)::int AS deleted_count,
        ROUND(COALESCE(AVG(CASE WHEN f.deleted_at IS NULL THEN f.rating END), 5.0)::numeric, 1)::float AS average_rating
      FROM events e
      LEFT JOIN feedback f ON f.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const { rows } = await q(sql, [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      eventDate: formatDate(r.event_date),
      venue: r.venue,
      description: r.description,
      isDisplayedOnWall: r.is_displayed_on_wall,
      isAcceptingFeedback: r.is_accepting_feedback,
      totalSubmissions: r.total_submissions,
      visibleCount: r.visible_count,
      hiddenCount: r.hidden_count,
      deletedCount: r.deleted_count,
      averageRating: r.average_rating,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  /**
   * Admin: Sets which events are displayed on the public live wall.
   * Transactionally sets is_displayed_on_wall = true for selected IDs, false for all others.
   */
  static async setWallSelection(eventIds: string[]): Promise<PublicEvent[]> {
    return withTransaction(async (client) => {
      // 1. Update all events
      if (eventIds.length > 0) {
        await client.query(
          `
          UPDATE events
          SET is_displayed_on_wall = CASE WHEN id = ANY($1::uuid[]) THEN true ELSE false END,
              updated_at = NOW()
          `,
          [eventIds]
        );
      } else {
        // Paused wall
        await client.query(`UPDATE events SET is_displayed_on_wall = false, updated_at = NOW()`);
      }

      // 2. Return active wall events
      const { rows } = await client.query(
        `
        SELECT id, name, slug, event_date, venue, description, is_displayed_on_wall, is_accepting_feedback
        FROM events
        WHERE is_displayed_on_wall = true
        ORDER BY event_date DESC, created_at DESC
        `
      );

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        eventDate: formatDate(r.event_date),
        venue: r.venue,
        description: r.description,
        isDisplayedOnWall: r.is_displayed_on_wall,
        isAcceptingFeedback: r.is_accepting_feedback,
      }));
    });
  }
}
