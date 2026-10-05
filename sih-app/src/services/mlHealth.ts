import { BASE_URL, resolveBaseUrl } from './analyticsClient';

export type MLConnectionStatus = 'live' | 'disconnected' | 'offline' | 'checking';

export interface MLHealthDetails {
  status: MLConnectionStatus;
  latencyMs: number | null;
  lastChecked: Date | null;
  serviceUrl: string;
  modelVersion?: string;
  error?: string;
}

/**
 * Checks if the client device itself is offline according to the browser or runtime.
 */
export function isDeviceOffline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return !navigator.onLine;
  }
  return false;
}

/**
 * Pings the ML service `/health` endpoint to verify live operational status.
 * Distinguishes between:
 * - 'live': Device is online and ML service responded with HTTP 200
 * - 'offline': Device has no network connection (navigator.onLine === false)
 * - 'disconnected': Device has internet, but cannot reach the ML service (timeout, 5xx, CORS, host down)
 */
export async function checkMLHealth(timeoutMs = 9000): Promise<MLHealthDetails> {
  const serviceUrl = resolveBaseUrl();

  // 1. Check if device is completely offline first
  if (isDeviceOffline()) {
    return {
      status: 'offline',
      latencyMs: null,
      lastChecked: new Date(),
      serviceUrl,
      error: 'Device is offline (no network connection)',
    };
  }

  // 2. Ping the ML service /health or /ping endpoint
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      let modelVersion = '1.0.0';
      try {
        const json = await response.json();
        modelVersion = json.version || json.model || '1.0.0';
      } catch (_) {}

      return {
        status: 'live',
        latencyMs,
        lastChecked: new Date(),
        serviceUrl,
        modelVersion,
      };
    } else {
      return {
        status: 'disconnected',
        latencyMs,
        lastChecked: new Date(),
        serviceUrl,
        error: `ML service returned status ${response.status}`,
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    // Check again if device went offline during the fetch attempt
    if (isDeviceOffline()) {
      return {
        status: 'offline',
        latencyMs: null,
        lastChecked: new Date(),
        serviceUrl,
        error: 'Device lost connection during request',
      };
    }

    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
    return {
      status: 'disconnected',
      latencyMs: isTimeout ? timeoutMs : latencyMs,
      lastChecked: new Date(),
      serviceUrl,
      error: isTimeout
        ? `Connection timed out after ${timeoutMs}ms (server waking up or unreachable)`
        : err?.message || 'ML service connection failed',
    };
  }
}

/**
 * Subscribes to browser window 'online' and 'offline' events if running on Web.
 * Returns an unbind cleanup function.
 */
export function subscribeToNetworkEvents(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
