import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '../features/offline-queue/offlineQueue.js';
import type { OfflineQueuedSubmission } from '@devbappa/shared';

export function useOfflineQueue(onSyncSuccess?: () => void) {
  const [queuedItems, setQueuedItems] = useState<OfflineQueuedSubmission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      const items = await offlineQueue.getQueuedItems();
      setQueuedItems(items);
    } catch {
      // IndexedDB might not be available or restricted in incognito
    }
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const result = await offlineQueue.processQueue();
      if (result.succeeded > 0) {
        onSyncSuccess?.();
      }
    } finally {
      setIsSyncing(false);
      refreshQueue();
    }
  }, [isSyncing, onSyncSuccess, refreshQueue]);

  useEffect(() => {
    refreshQueue();

    const handleOnline = () => {
      syncQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshQueue, syncQueue]);

  return {
    queuedItems,
    queuedCount: queuedItems.length,
    isSyncing,
    refreshQueue,
    syncQueue,
    discardItem: async (key: string) => {
      await offlineQueue.discardItem(key);
      refreshQueue();
    },
  };
}
