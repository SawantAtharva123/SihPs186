import { getDatabase } from '../offline/database';

export async function getCacheEntry(key: string): Promise<{
  payload: any;
  confidence: number;
  model_version: string;
  generated_at: string;
  stale: boolean;
} | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    payload: string;
    confidence: number;
    model_version: string;
    generated_at: string;
    stale: number;
  }>(
    'SELECT payload, confidence, model_version, generated_at, stale FROM analytics_cache WHERE key = ?',
    [key]
  );
  if (!row) return null;
  return {
    payload: JSON.parse(row.payload),
    confidence: row.confidence,
    model_version: row.model_version,
    generated_at: row.generated_at,
    stale: row.stale === 1,
  };
}

export async function setCacheEntry(
  key: string,
  personId: string | null,
  unitId: string | null,
  kind: string,
  payload: any,
  confidence: number,
  modelVersion: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO analytics_cache (key, person_id, unit_id, kind, payload, confidence, model_version, generated_at, stale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
    [key, personId, unitId, kind, JSON.stringify(payload), confidence, modelVersion, new Date().toISOString()]
  );
}

export async function markCacheStale(personId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE analytics_cache SET stale = 1 WHERE person_id = ?', [personId]);
}
