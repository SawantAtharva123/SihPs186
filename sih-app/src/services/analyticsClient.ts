import { getDatabase } from '../offline/database';

const BASE_URL = process.env.EXPO_PUBLIC_ML_SERVICE_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsResponse<T = any> {
  data: T;
  confidence: number;
  warnings: string[];
  model_version: string;
  generated_at: string;
  stale?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}

async function postToML<T>(endpoint: string, body: object): Promise<AnalyticsResponse<T>> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`ML service error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<AnalyticsResponse<T>>;
}

async function getCached<T>(key: string): Promise<AnalyticsResponse<T> | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    payload: string;
    confidence: number;
    model_version: string;
    generated_at: string;
  }>(
    'SELECT payload, confidence, model_version, generated_at FROM analytics_cache WHERE key = ?',
    [key],
  );
  if (!row) return null;
  return {
    data: JSON.parse(row.payload) as T,
    confidence: row.confidence,
    warnings: ['Cached result — ML service was unreachable.'],
    model_version: row.model_version,
    generated_at: row.generated_at,
    stale: true,
  };
}

async function setCache(
  key: string,
  personId: string | null,
  unitId: string | null,
  kind: string,
  result: AnalyticsResponse,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO analytics_cache
       (key, person_id, unit_id, kind, payload, confidence, model_version, generated_at, stale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      key,
      personId,
      unitId,
      kind,
      JSON.stringify(result.data),
      result.confidence,
      result.model_version,
      result.generated_at,
    ],
  );
}

/** Returns a safe offline fallback when neither live nor cached data exist. */
function offlineFallback<T>(defaultData: T): AnalyticsResponse<T> {
  return {
    data: defaultData,
    confidence: 0,
    warnings: ['Offline — no cached data available.'],
    model_version: 'offline',
    generated_at: new Date().toISOString(),
    stale: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeBaseline(
  personId: string,
  metric: string,
  series: { date: string; value: number }[],
): Promise<AnalyticsResponse> {
  const cacheKey = `baseline:${personId}:${metric}`;
  try {
    const result = await postToML('/baseline/calculate', { person_id: personId, metric, series });
    await setCache(cacheKey, personId, null, 'baseline', result);
    return result;
  } catch {
    return (await getCached(cacheKey)) ?? offlineFallback({});
  }
}

export async function analyzeRecovery(
  personId: string,
  payload: object,
): Promise<AnalyticsResponse> {
  const cacheKey = `recovery:${personId}`;
  try {
    const result = await postToML('/recovery/analyze', payload);
    await setCache(cacheKey, personId, null, 'recovery', result);
    return result;
  } catch {
    return (await getCached(cacheKey)) ?? offlineFallback({});
  }
}

export async function analyzeDeviation(
  personId: string,
  series: object[],
  metric: string,
): Promise<AnalyticsResponse> {
  const cacheKey = `deviation:${personId}:${metric}`;
  try {
    const result = await postToML('/deviation/analyze', { series, metric });
    await setCache(cacheKey, personId, null, 'deviation', result);
    return result;
  } catch {
    return (await getCached(cacheKey)) ?? offlineFallback({});
  }
}

export async function simulatePerson(
  personId: string,
  current: object,
  scenario: object,
): Promise<AnalyticsResponse> {
  const cacheKey = `simulate_person:${personId}:${JSON.stringify(scenario)}`;
  try {
    const result = await postToML('/simulate/person', { current, scenario });
    await setCache(cacheKey, personId, null, 'simulation', result);
    return result;
  } catch {
    return (
      (await getCached(cacheKey)) ??
      offlineFallback({
        current_burden: 0,
        scenario_burden: 0,
        direction: 'Stable',
        warning: 'Model simulation — not a guaranteed outcome.',
      })
    );
  }
}

export async function getRecommendations(
  personId: string,
  bundle: object,
): Promise<AnalyticsResponse> {
  const cacheKey = `recommendations:${personId}`;
  try {
    const result = await postToML('/recommendations/welfare', { bundle });
    await setCache(cacheKey, personId, null, 'recommendations', result);
    return result;
  } catch {
    return (await getCached(cacheKey)) ?? offlineFallback({ recommendations: [] });
  }
}

export async function explainPerson(
  personId: string,
  payload: object,
): Promise<AnalyticsResponse> {
  const cacheKey = `explain:${personId}`;
  try {
    const result = await postToML('/explain/person', payload);
    await setCache(cacheKey, personId, null, 'explanation', result);
    return result;
  } catch {
    return (await getCached(cacheKey)) ?? offlineFallback({ timeline: [], formatted: [] });
  }
}

export async function analyzeSignalAgreement(
  personId: string,
  signals: object,
): Promise<AnalyticsResponse> {
  const cacheKey = `signal_agreement:${personId}`;
  try {
    const result = await postToML('/signal-agreement/analyze', { signals });
    await setCache(cacheKey, personId, null, 'signal_agreement', result);
    return result;
  } catch {
    return (
      (await getCached(cacheKey)) ??
      offlineFallback({ agreement_level: 'Unknown', conflict: false, missing_count: 0 })
    );
  }
}
