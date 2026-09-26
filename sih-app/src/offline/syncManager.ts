import { dequeue, remove, incrementAttempts, getPendingCount } from './syncQueue';
import { shouldRetry } from './retryPolicy';

/** Prevents concurrent drain runs from overlapping. */
let syncInProgress = false;

export interface DrainResult {
  synced: number;
  failed: number;
  pending: number;
}

/**
 * Processes pending sync queue items.
 *
 * Guards:
 *  - No network → returns pending count immediately.
 *  - Supabase not configured → same (local-demo mode).
 *  - Already draining → same (re-entrant guard).
 *
 * Production upgrade: replace the `// ── production sync ──` block with a real
 * Supabase upsert / delete call using item.payload and item.operation.
 */
export async function drainQueue(
  isOnline: boolean,
  supabaseConfigured: boolean,
): Promise<DrainResult> {
  if (!isOnline || !supabaseConfigured || syncInProgress) {
    const pending = await getPendingCount();
    return { synced: 0, failed: 0, pending };
  }

  syncInProgress = true;
  let synced = 0;
  let failed = 0;

  try {
    const items = await dequeue(20);

    for (const item of items) {
      // Drop items that have exhausted their retry budget
      if (!shouldRetry(item.attempts)) {
        await remove(item.id);
        failed++;
        continue;
      }

      try {
        // ── production sync ─────────────────────────────────────────────────
        // const payload = JSON.parse(item.payload);
        // if (item.operation === 'DELETE') {
        //   await supabase.from(item.table_name).delete().eq('id', item.row_id);
        // } else {
        //   await supabase.from(item.table_name).upsert(payload);
        // }
        // ────────────────────────────────────────────────────────────────────
        // Demo / local mode: treat every item as successfully synced.
        await remove(item.id);
        synced++;
      } catch {
        await incrementAttempts(item.id);
        failed++;
      }
    }
  } finally {
    syncInProgress = false;
  }

  const pending = await getPendingCount();
  return { synced, failed, pending };
}

/** Exposes current drain state so UI indicators can show a spinner. */
export function isSyncing(): boolean {
  return syncInProgress;
}
