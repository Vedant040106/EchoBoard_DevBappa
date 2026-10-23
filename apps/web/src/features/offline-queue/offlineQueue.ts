import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FeedbackSubmissionInput, OfflineQueuedSubmission } from '@devbappa/shared';
import { api } from '../../services/api.js';

interface FeedbackQueueDB extends DBSchema {
  submissions: {
    key: string; // idempotencyKey
    value: OfflineQueuedSubmission;
    indexes: { 'by-queuedAt': number };
  };
}

const DB_NAME = 'devbappa-offline-db';
const DB_VERSION = 1;
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let dbPromise: Promise<IDBPDatabase<FeedbackQueueDB>> | null = null;

function getDb(): Promise<IDBPDatabase<FeedbackQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FeedbackQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('submissions')) {
          const store = db.createObjectStore('submissions', { keyPath: 'idempotencyKey' });
          store.createIndex('by-queuedAt', 'queuedAt');
        }
      },
    });
  }
  return dbPromise;
}

export const offlineQueue = {
  /**
   * Enqueue a validated feedback submission into durable IndexedDB
   */
  async enqueue(submission: FeedbackSubmissionInput): Promise<OfflineQueuedSubmission> {
    const db = await getDb();
    const queuedItem: OfflineQueuedSubmission = {
      idempotencyKey: submission.idempotencyKey,
      submission,
      queuedAt: Date.now(),
      status: 'queued',
      retryCount: 0,
    };

    await db.put('submissions', queuedItem);
    return queuedItem;
  },

  /**
   * Get all currently queued submissions
   */
  async getQueuedItems(): Promise<OfflineQueuedSubmission[]> {
    const db = await getDb();
    const items = await db.getAll('submissions');
    const now = Date.now();

    // Clean up expired items older than 7 days
    const valid: OfflineQueuedSubmission[] = [];
    for (const item of items) {
      if (now - item.queuedAt > MAX_QUEUE_AGE_MS) {
        await db.delete('submissions', item.idempotencyKey);
      } else {
        valid.push(item);
      }
    }
    return valid;
  },

  /**
   * Get count of pending queued items
   */
  async getPendingCount(): Promise<number> {
    const items = await this.getQueuedItems();
    return items.length;
  },

  /**
   * Discard/delete a pending submission manually
   */
  async discardItem(idempotencyKey: string): Promise<void> {
    const db = await getDb();
    await db.delete('submissions', idempotencyKey);
  },

  /**
   * Process all pending queued submissions by attempting to sync them with the backend.
   * Only deletes from IndexedDB when server successfully confirms acceptance.
   */
  async processQueue(onProgress?: (synced: number, total: number) => void): Promise<{
    succeeded: number;
    failed: number;
  }> {
    const items = await this.getQueuedItems();
    if (items.length === 0) return { succeeded: 0, failed: 0 };

    const db = await getDb();
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Mark as syncing
        item.status = 'syncing';
        item.retryCount += 1;
        await db.put('submissions', item);

        // Submit with existing idempotency key to prevent duplication
        await api.submitFeedback(item.submission);

        // Server confirmed persistent record! Safely remove from IndexedDB
        await db.delete('submissions', item.idempotencyKey);
        succeeded++;
      } catch (err: any) {
        // If 400 validation error (permanently invalid), mark failed with message
        if (err.status === 400) {
          item.status = 'failed';
          item.errorMessage = err.message || 'Validation failed on server';
          await db.put('submissions', item);
        } else {
          // Network interruption or temporary server issue, retain in queue for next retry
          item.status = 'queued';
          await db.put('submissions', item);
        }
        failed++;
      }

      onProgress?.(succeeded, items.length);
    }

    return { succeeded, failed };
  },
};
