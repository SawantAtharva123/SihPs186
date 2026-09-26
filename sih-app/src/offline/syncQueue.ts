import { getDatabase } from './database';

export interface SyncItem {
  id: string;
  table_name: string;
  row_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  priority: number;
  created_at: string;
  attempts: number;
}

/**
 * Adds a row change to the outbound sync queue.
 * Uses INSERT OR REPLACE so re-queuing an already-pending change for the same
 * row simply refreshes the payload without creating duplicates.
 */
export async function enqueue(
  tableName: string,
  rowId: string,
  operation: SyncItem['operation'],
  payload: object,
): Promise<void> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_queue
       (id, table_name, row_id, operation, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tableName, rowId, operation, JSON.stringify(payload), new Date().toISOString()],
  );
}

/**
 * Returns up to `limit` pending items ordered by priority (desc) then age (asc).
 */
export async function dequeue(limit = 10): Promise<SyncItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<SyncItem>(
    'SELECT * FROM sync_queue ORDER BY priority DESC, created_at ASC LIMIT ?',
    [limit],
  );
}

/** Removes a successfully synced item from the queue. */
export async function remove(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

/** Increments the retry counter so the retry policy can gate further attempts. */
export async function incrementAttempts(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?',
    [id],
  );
}

/** Returns the total number of items waiting to be synced. */
export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue',
  );
  return result?.count ?? 0;
}
