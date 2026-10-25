import type pg from 'pg';
import { query, withTransaction } from '../index.js';
import { CanvasRepository } from './canvas.repository.js';
import type {
  PublicFeedbackNote,
  AdminFeedbackItem,
  PublicStats,
  AdminAnalytics,
  PaginatedData,
  Role,
  NoteColor,
  PinVariant,
  NoteSize,
  VisibilityStatus,
} from '@devbappa/shared';

export interface CreateFeedbackParams {
  fullName: string;
  publicDisplayName: string;
  role: Role;
  department: string | null;
  designation: string | null;
  institutionName: string | null;
  message: string;
  idempotencyKey: string;
  colorVariant: NoteColor;
  pinVariant: PinVariant;
  sizeVariant: NoteSize;
}

export class FeedbackRepository {
  /**
   * Creates a feedback record and its persistent canvas layout inside a single database transaction.
   * Ensures idempotency: if key exists, returns existing persisted record.
   */
  static async createFeedbackWithLayout(
    params: CreateFeedbackParams
  ): Promise<{ note: PublicFeedbackNote; isDuplicate: boolean }> {
    // 1. Check if record with this idempotency key already exists
    const existing = await this.findByIdempotencyKey(params.idempotencyKey);
    if (existing) {
      return { note: existing, isDuplicate: true };
    }

    return withTransaction(async (client) => {
      // Re-check inside transaction with FOR UPDATE lock on idempotency key
      const existingInTx = await client.query(
        `SELECT f.id FROM feedback f WHERE f.idempotency_key = $1`,
        [params.idempotencyKey]
      );

      if (existingInTx.rows.length > 0) {
        const fullExisting = await this.findByIdempotencyKey(params.idempotencyKey, client);
        if (fullExisting) {
          return { note: fullExisting, isDuplicate: true };
        }
      }

      // Insert Feedback
      const feedbackSql = `
        INSERT INTO feedback (
          full_name,
          public_display_name,
          role,
          department,
          designation,
          institution_name,
          message,
          visibility_status,
          deleted_at,
          idempotency_key,
          color_variant,
          pin_variant,
          size_variant,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'visible', NULL, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, public_display_name, role, department, designation, institution_name,
                  message, color_variant, pin_variant, size_variant, created_at
      `;

      const feedbackValues = [
        params.fullName,
        params.publicDisplayName,
        params.role,
        params.department,
        params.designation,
        params.institutionName,
        params.message,
        params.idempotencyKey,
        params.colorVariant,
        params.pinVariant,
        params.sizeVariant,
      ];

      const { rows: fbRows } = await client.query(feedbackSql, feedbackValues);
      const fb = fbRows[0];

      // Calculate deterministic spatial coordinates
      const layout = await CanvasRepository.calculateNextPlacement(client);

      // Insert Canvas Layout
      const layoutSql = `
        INSERT INTO canvas_layout (
          feedback_id,
          world_x,
          world_y,
          rotation,
          width,
          height,
          layer_order,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING world_x, world_y, rotation, width, height, layer_order
      `;

      const { rows: layoutRows } = await client.query(layoutSql, [
        fb.id,
        layout.worldX,
        layout.worldY,
        layout.rotation,
        layout.width,
        layout.height,
        layout.layerOrder,
      ]);
      const l = layoutRows[0];

      const note: PublicFeedbackNote = {
        id: fb.id,
        publicDisplayName: fb.public_display_name,
        role: fb.role,
        department: fb.department,
        designation: fb.designation,
        institutionName: fb.institution_name,
        message: fb.message,
        createdAt: fb.created_at.toISOString(),
        colorVariant: fb.color_variant,
        pinVariant: fb.pin_variant,
        sizeVariant: fb.size_variant,
        layout: {
          worldX: l.world_x,
          worldY: l.world_y,
          rotation: l.rotation,
          width: l.width,
          height: l.height,
          layerOrder: l.layer_order,
        },
      };

      return { note, isDuplicate: false };
    });
  }

  static async findByIdempotencyKey(
    key: string,
    client?: pg.PoolClient
  ): Promise<PublicFeedbackNote | null> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT f.id, f.public_display_name, f.role, f.department, f.designation, f.institution_name,
             f.message, f.color_variant, f.pin_variant, f.size_variant, f.created_at,
             l.world_x, l.world_y, l.rotation, l.width, l.height, l.layer_order
      FROM feedback f
      LEFT JOIN canvas_layout l ON l.feedback_id = f.id
      WHERE f.idempotency_key = $1
    `;
    const { rows } = await q(sql, [key]);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout: {
        worldX: r.world_x ?? 0,
        worldY: r.world_y ?? 0,
        rotation: r.rotation ?? 0,
        width: r.width ?? 240,
        height: r.height ?? 240,
        layerOrder: r.layer_order ?? 1,
      },
    };
  }

  static async getPublicNotes(): Promise<PublicFeedbackNote[]> {
    const sql = `
      SELECT f.id, f.public_display_name, f.role, f.department, f.designation, f.institution_name,
             f.message, f.color_variant, f.pin_variant, f.size_variant, f.created_at,
             l.world_x, l.world_y, l.rotation, l.width, l.height, l.layer_order
      FROM feedback f
      LEFT JOIN canvas_layout l ON l.feedback_id = f.id
      WHERE f.deleted_at IS NULL AND f.visibility_status = 'visible'
      ORDER BY COALESCE(l.layer_order, 1) ASC, f.created_at ASC
    `;

    const { rows } = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout: {
        worldX: r.world_x ?? 0,
        worldY: r.world_y ?? 0,
        rotation: r.rotation ?? 0,
        width: r.width ?? 240,
        height: r.height ?? 240,
        layerOrder: r.layer_order ?? 1,
      },
    }));
  }

  static async getPublicNoteById(id: string): Promise<PublicFeedbackNote | null> {
    const sql = `
      SELECT f.id, f.public_display_name, f.role, f.department, f.designation, f.institution_name,
             f.message, f.color_variant, f.pin_variant, f.size_variant, f.created_at,
             l.world_x, l.world_y, l.rotation, l.width, l.height, l.layer_order
      FROM feedback f
      LEFT JOIN canvas_layout l ON l.feedback_id = f.id
      WHERE f.id = $1 AND f.deleted_at IS NULL AND f.visibility_status = 'visible'
    `;
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout: {
        worldX: r.world_x ?? 0,
        worldY: r.world_y ?? 0,
        rotation: r.rotation ?? 0,
        width: r.width ?? 240,
        height: r.height ?? 240,
        layerOrder: r.layer_order ?? 1,
      },
    };
  }

  static async getPublicHistory(options: {
    search?: string;
    role?: Role;
    page: number;
    limit: number;
  }): Promise<PaginatedData<PublicFeedbackNote>> {
    const { search, role, page, limit } = options;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['f.deleted_at IS NULL', "f.visibility_status = 'visible'"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (role) {
      whereClauses.push(`f.role = $${paramIndex++}`);
      values.push(role);
    }

    if (search && search.trim().length > 0) {
      whereClauses.push(
        `(f.public_display_name ILIKE $${paramIndex} OR f.message ILIKE $${paramIndex})`
      );
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM feedback f ${whereSql}`;
    const { rows: countRows } = await query<{ total: number }>(countSql, values);
    const total = countRows[0]?.total ?? 0;

    const dataSql = `
      SELECT f.id, f.public_display_name, f.role, f.department, f.designation, f.institution_name,
             f.message, f.color_variant, f.pin_variant, f.size_variant, f.created_at,
             l.world_x, l.world_y, l.rotation, l.width, l.height, l.layer_order
      FROM feedback f
      LEFT JOIN canvas_layout l ON l.feedback_id = f.id
      ${whereSql}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const { rows } = await query(dataSql, [...values, limit, offset]);

    const items: PublicFeedbackNote[] = rows.map((r) => ({
      id: r.id,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout: {
        worldX: r.world_x ?? 0,
        worldY: r.world_y ?? 0,
        rotation: r.rotation ?? 0,
        width: r.width ?? 240,
        height: r.height ?? 240,
        layerOrder: r.layer_order ?? 1,
      },
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getPublicStats(): Promise<PublicStats> {
    const sql = `
      SELECT
        COUNT(*)::int AS total_accepted,
        COUNT(CASE WHEN role = 'Student' THEN 1 END)::int AS students,
        COUNT(CASE WHEN role = 'Faculty' THEN 1 END)::int AS faculty,
        COUNT(CASE WHEN role = 'Other Visitor' THEN 1 END)::int AS other_visitors
      FROM feedback
      WHERE deleted_at IS NULL
    `;
    const { rows } = await query(sql);
    const r = rows[0] || { total_accepted: 0, students: 0, faculty: 0, other_visitors: 0 };

    return {
      totalAccepted: r.total_accepted,
      students: r.students,
      faculty: r.faculty,
      otherVisitors: r.other_visitors,
      lastUpdated: new Date().toISOString(),
    };
  }

  static async getAdminFeedback(options: {
    search?: string;
    role?: Role;
    status: 'all' | 'visible' | 'hidden' | 'deleted';
    page: number;
    limit: number;
  }): Promise<PaginatedData<AdminFeedbackItem>> {
    const { search, role, status, page, limit } = options;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (status === 'visible') {
      whereClauses.push("f.deleted_at IS NULL AND f.visibility_status = 'visible'");
    } else if (status === 'hidden') {
      whereClauses.push("f.deleted_at IS NULL AND f.visibility_status = 'hidden'");
    } else if (status === 'deleted') {
      whereClauses.push('f.deleted_at IS NOT NULL');
    }

    if (role) {
      whereClauses.push(`f.role = $${paramIndex++}`);
      values.push(role);
    }

    if (search && search.trim().length > 0) {
      whereClauses.push(
        `(f.full_name ILIKE $${paramIndex} OR f.public_display_name ILIKE $${paramIndex} OR f.message ILIKE $${paramIndex} OR f.department ILIKE $${paramIndex} OR f.institution_name ILIKE $${paramIndex})`
      );
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM feedback f ${whereSql}`;
    const { rows: countRows } = await query<{ total: number }>(countSql, values);
    const total = countRows[0]?.total ?? 0;

    const dataSql = `
      SELECT f.id, f.full_name, f.public_display_name, f.role, f.department, f.designation,
             f.institution_name, f.message, f.visibility_status, f.deleted_at, f.idempotency_key,
             f.color_variant, f.pin_variant, f.size_variant, f.created_at, f.updated_at,
             l.world_x, l.world_y, l.rotation, l.width, l.height, l.layer_order
      FROM feedback f
      LEFT JOIN canvas_layout l ON l.feedback_id = f.id
      ${whereSql}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const { rows } = await query(dataSql, [...values, limit, offset]);

    const items: AdminFeedbackItem[] = rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      visibilityStatus: r.visibility_status,
      deletedAt: r.deleted_at ? r.deleted_at.toISOString() : null,
      idempotencyKey: r.idempotency_key,
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout: {
        worldX: r.world_x ?? 0,
        worldY: r.world_y ?? 0,
        rotation: r.rotation ?? 0,
        width: r.width ?? 240,
        height: r.height ?? 240,
        layerOrder: r.layer_order ?? 1,
      },
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getAdminAnalytics(): Promise<AdminAnalytics> {
    const totalsSql = `
      SELECT
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END)::int AS total_accepted,
        COUNT(CASE WHEN deleted_at IS NULL AND visibility_status = 'visible' THEN 1 END)::int AS total_visible,
        COUNT(CASE WHEN deleted_at IS NULL AND visibility_status = 'hidden' THEN 1 END)::int AS total_hidden,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END)::int AS total_deleted,
        COUNT(CASE WHEN deleted_at IS NULL AND role = 'Student' THEN 1 END)::int AS students,
        COUNT(CASE WHEN deleted_at IS NULL AND role = 'Faculty' THEN 1 END)::int AS faculty,
        COUNT(CASE WHEN deleted_at IS NULL AND role = 'Other Visitor' THEN 1 END)::int AS other_visitors
      FROM feedback
    `;

    const { rows: totalRows } = await query(totalsSql);
    const t = totalRows[0] || {
      total_accepted: 0,
      total_visible: 0,
      total_hidden: 0,
      total_deleted: 0,
      students: 0,
      faculty: 0,
      other_visitors: 0,
    };

    const deptSql = `
      SELECT COALESCE(department, 'Unspecified') AS department, COUNT(*)::int AS count
      FROM feedback
      WHERE deleted_at IS NULL AND department IS NOT NULL AND TRIM(department) != ''
      GROUP BY department
      ORDER BY count DESC
      LIMIT 20
    `;
    const { rows: deptRows } = await query<{ department: string; count: number }>(deptSql);
    const departmentBreakdown: Record<string, number> = {};
    for (const d of deptRows) {
      departmentBreakdown[d.department] = d.count;
    }

    return {
      totalAccepted: t.total_accepted,
      totalVisible: t.total_visible,
      totalHidden: t.total_hidden,
      totalDeleted: t.total_deleted,
      roleBreakdown: {
        Student: t.students,
        Faculty: t.faculty,
        'Other Visitor': t.other_visitors,
      },
      departmentBreakdown,
    };
  }

  static async setVisibility(
    id: string,
    visibility: VisibilityStatus,
    client?: pg.PoolClient
  ): Promise<PublicFeedbackNote | null> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      UPDATE feedback
      SET visibility_status = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, public_display_name, role, department, designation, institution_name,
                message, color_variant, pin_variant, size_variant, created_at, visibility_status
    `;

    const { rows } = await q(sql, [id, visibility]);
    if (rows.length === 0) return null;

    const r = rows[0];
    const layoutRes = await q(
      `SELECT world_x, world_y, rotation, width, height, layer_order FROM canvas_layout WHERE feedback_id = $1`,
      [id]
    );

    let layout: {
      worldX: number;
      worldY: number;
      rotation: number;
      width: number;
      height: number;
      layerOrder: number;
    };

    if (layoutRes.rows.length > 0) {
      const l = layoutRes.rows[0];
      layout = {
        worldX: l.world_x,
        worldY: l.world_y,
        rotation: l.rotation,
        width: l.width,
        height: l.height,
        layerOrder: l.layer_order,
      };
    } else {
      layout = await CanvasRepository.calculateNextPlacement(client);
    }

    return {
      id: r.id,
      publicDisplayName: r.public_display_name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      institutionName: r.institution_name,
      message: r.message,
      createdAt: r.created_at.toISOString(),
      colorVariant: r.color_variant,
      pinVariant: r.pin_variant,
      sizeVariant: r.size_variant,
      layout,
    };
  }

  static async softDelete(id: string, client?: pg.PoolClient): Promise<boolean> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      UPDATE feedback
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const { rowCount } = await q(sql, [id]);
    return (rowCount ?? 0) > 0;
  }

  static async recover(id: string, client?: pg.PoolClient): Promise<boolean> {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      UPDATE feedback
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING id
    `;
    const { rowCount } = await q(sql, [id]);
    return (rowCount ?? 0) > 0;
  }
}
