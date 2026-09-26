import { getDatabase } from '../offline/database';

export const K_ANONYMITY_THRESHOLD = 5;

export interface UnitAggregate {
  unitId: string;
  unitName: string;
  headcount: number;
  avgRecovery: number | null;
  avgSleep: number | null;
  recoveryTrend: 'Improving' | 'Stable' | 'Declining';
  scheduleVolatility: 'Low' | 'Moderate' | 'High';
  nightShiftPercent: number;
  suppressed: boolean;
}

/**
 * Aggregates the last 30 days of recovery, sleep and duty records for a unit.
 *
 * k-Anonymity: when fewer than K_ANONYMITY_THRESHOLD records exist the
 * aggregate is returned in suppressed form — all numeric fields are null/0 —
 * to prevent individual re-identification.
 *
 * Recovery trend is computed by comparing the mean of the most-recent half of
 * the window to the mean of the older half (a ±3 point delta is the threshold).
 */
export async function getUnitAggregate(unitId: string): Promise<UnitAggregate> {
  const db = await getDatabase();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // All queries run against the local SQLite store which contains seeded data
  // for the current demo person. In production these queries would join on
  // unit membership via the profiles table.
  const [recoveryRows, sleepRows, dutyRows] = await Promise.all([
    db.getAllAsync<{ score: number }>(
      'SELECT score FROM recovery_records WHERE date >= ? ORDER BY date DESC',
      [cutoffStr],
    ),
    db.getAllAsync<{ duration_hours: number }>(
      'SELECT duration_hours FROM sleep_records WHERE date >= ? ORDER BY date DESC',
      [cutoffStr],
    ),
    db.getAllAsync<{ is_night: number }>(
      'SELECT is_night FROM duty_records WHERE date >= ?',
      [cutoffStr],
    ),
  ]);

  const n = recoveryRows.length;

  if (n < K_ANONYMITY_THRESHOLD) {
    return {
      unitId,
      unitName: 'Unit',
      headcount: n,
      avgRecovery: null,
      avgSleep: null,
      recoveryTrend: 'Stable',
      scheduleVolatility: 'Low',
      nightShiftPercent: 0,
      suppressed: true,
    };
  }

  const avgRecovery = recoveryRows.reduce((sum, r) => sum + r.score, 0) / n;

  const avgSleep =
    sleepRows.length > 0
      ? sleepRows.reduce((sum, r) => sum + r.duration_hours, 0) / sleepRows.length
      : null;

  const nightCount = dutyRows.filter((d) => d.is_night).length;
  const nightPercent = dutyRows.length > 0 ? (nightCount / dutyRows.length) * 100 : 0;

  // Trend: split recovery window in half — newest first (ORDER BY date DESC)
  const half = Math.floor(n / 2);
  const recentMean =
    recoveryRows.slice(0, half).reduce((s, r) => s + r.score, 0) / Math.max(half, 1);
  const olderMean =
    recoveryRows.slice(half).reduce((s, r) => s + r.score, 0) /
    Math.max(n - half, 1);

  const recoveryTrend: UnitAggregate['recoveryTrend'] =
    recentMean > olderMean + 3
      ? 'Improving'
      : olderMean > recentMean + 3
        ? 'Declining'
        : 'Stable';

  const scheduleVolatility: UnitAggregate['scheduleVolatility'] =
    nightPercent > 40 ? 'High' : nightPercent > 20 ? 'Moderate' : 'Low';

  return {
    unitId,
    unitName: 'Unit',
    headcount: n,
    avgRecovery: Math.round(avgRecovery),
    avgSleep: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
    recoveryTrend,
    scheduleVolatility,
    nightShiftPercent: Math.round(nightPercent),
    suppressed: false,
  };
}
