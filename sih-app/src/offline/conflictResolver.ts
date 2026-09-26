/**
 * Conflict resolution strategy:
 *  - Observation tables (user-generated captures) → client-wins
 *  - Profile / settings / reference tables       → server-wins
 */

export type ConflictStrategy = 'client-wins' | 'server-wins';

/** Tables that represent first-hand observations captured on the device. */
const OBSERVATION_TABLES = new Set([
  'check_ins',
  'activity_sessions',
  'activity_attempts',
  'duty_records',
  'sleep_records',
  'recovery_records',
  'support_requests',
  'unit_pulses',
  'personnel_feedback',
  'welfare_cases',
  'interventions',
  'intervention_followups',
]);

export function getStrategy(tableName: string): ConflictStrategy {
  return OBSERVATION_TABLES.has(tableName) ? 'client-wins' : 'server-wins';
}

/**
 * Merges local and remote versions of a row according to the table's strategy.
 * - client-wins: local row is kept as-is.
 * - server-wins: remote row is used, but the local client_id is preserved so
 *   future syncs can still correlate the row.
 */
export function resolve<T extends { updated_at?: string }>(
  tableName: string,
  local: T,
  remote: T,
): T {
  const strategy = getStrategy(tableName);
  if (strategy === 'client-wins') {
    return local;
  }
  // server-wins: adopt remote data but preserve local client_id
  return { ...remote, client_id: (local as any).client_id };
}
