import type pg from 'pg';
import { query } from '../index.js';
import type { CanvasNoteLayout } from '@devbappa/shared';

export interface LayoutRow {
  id: string;
  feedback_id: string;
  world_x: number;
  world_y: number;
  rotation: number;
  width: number;
  height: number;
  layer_order: number;
  updated_at: string;
}

export class CanvasRepository {
  /**
   * Deterministically calculates coordinates for a new note.
   * Uses an organic spiral dispersion from center so notes cluster naturally like a pinboard,
   * with controlled jitter to avoid artificial grid stiffness.
   */
  static async calculateNextPlacement(client?: pg.PoolClient): Promise<{
    worldX: number;
    worldY: number;
    rotation: number;
    width: number;
    height: number;
    layerOrder: number;
  }> {
    const q = client ? client.query.bind(client) : query;
    const { rows } = await q(
      `SELECT COUNT(*)::int AS count, COALESCE(MAX(layer_order), 0)::int AS max_layer FROM canvas_layout`
    );

    const count = rows[0]?.count ?? 0;
    const nextLayer = (rows[0]?.max_layer ?? 0) + 1;

    // Golden ratio spiral placement (Fermat's spiral / Sunflower model)
    // spacing between notes: ~260px
    const spacing = 260;
    const theta = count * 2.399963; // ~137.5 degrees in radians (golden angle)
    const r = Math.sqrt(count) * spacing;

    // Small controlled organic jitter:
    const jitterX = ((Math.sin(count * 7) * 25));
    const jitterY = ((Math.cos(count * 5) * 25));

    const worldX = Math.round(r * Math.cos(theta) + jitterX);
    const worldY = Math.round(r * Math.sin(theta) + jitterY);

    // Natural paper rotation: small angle between -4.5 and +4.5 degrees
    const rotation = parseFloat(((Math.sin(count * 13) * 4.5)).toFixed(2));

    return {
      worldX,
      worldY,
      rotation,
      width: 240,
      height: 240,
      layerOrder: nextLayer,
    };
  }

  static async updateLayout(
    feedbackId: string,
    updates: Partial<CanvasNoteLayout>,
    client?: pg.PoolClient
  ): Promise<CanvasNoteLayout | null> {
    const q = client ? client.query.bind(client) : query;

    const fields: string[] = [];
    const values: unknown[] = [feedbackId];
    let paramIndex = 2;

    if (updates.worldX !== undefined) {
      fields.push(`world_x = $${paramIndex++}`);
      values.push(updates.worldX);
    }
    if (updates.worldY !== undefined) {
      fields.push(`world_y = $${paramIndex++}`);
      values.push(updates.worldY);
    }
    if (updates.rotation !== undefined) {
      fields.push(`rotation = $${paramIndex++}`);
      values.push(updates.rotation);
    }
    if (updates.layerOrder !== undefined) {
      fields.push(`layer_order = $${paramIndex++}`);
      values.push(updates.layerOrder);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = NOW()');

    const sql = `
      UPDATE canvas_layout
      SET ${fields.join(', ')}
      WHERE feedback_id = $1
      RETURNING world_x, world_y, rotation, width, height, layer_order
    `;

    const { rows } = await q(sql, values);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      worldX: row.world_x,
      worldY: row.world_y,
      rotation: row.rotation,
      width: row.width,
      height: row.height,
      layerOrder: row.layer_order,
    };
  }
}
