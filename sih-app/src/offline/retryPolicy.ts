export const BACKOFF_DELAYS = [5000, 15000, 30000, 60000];
export const MAX_ATTEMPTS = 5;

/**
 * Returns the number of milliseconds to wait before the next retry attempt.
 * Uses exponential-style stepped backoff capped at the last BACKOFF_DELAYS entry.
 */
export function getBackoffDelay(attempts: number): number {
  const index = Math.min(attempts, BACKOFF_DELAYS.length - 1);
  return BACKOFF_DELAYS[index];
}

/**
 * Returns true when the item still has remaining retry budget.
 */
export function shouldRetry(attempts: number): boolean {
  return attempts < MAX_ATTEMPTS;
}
