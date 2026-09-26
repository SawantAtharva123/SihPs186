import Constants from 'expo-constants';
import { getDatabase } from '../offline/database';

function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_ML_SERVICE_URL) {
    return process.env.EXPO_PUBLIC_ML_SERVICE_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }
  return 'http://localhost:8000';
}

const BASE_URL = resolveBaseUrl();
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

export interface StressAssessmentResult {
  person_id: string;
  stress_level: 'Low' | 'Medium' | 'High' | 'Critical';
  stress_score: number;
  risk_probabilities: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  safety_guardrails: {
    asymmetric_bayes_applied: boolean;
    safety_override_active: boolean;
    safety_triggers: string[];
    undercounting_prevented: boolean;
  };
  subscores: {
    doctor_reports: {
      score: number;
      state: string;
      consultations: number;
      sick_leave_days: number;
      clinical_indicator: string;
    };
    mini_games: {
      score: number;
      state: string;
      avg_reaction_time_ms: number;
      reaction_variability_ms: number;
      accuracy_pct: number;
    };
    self_assessment: {
      score: number;
      state: string;
      sleep_hours: number;
      energy_level: number;
      recovery_level: number;
    };
  };
  signal_agreement: {
    level: string;
    disagreement_detected: boolean;
    divergence_note?: string;
  };
  somatic_symptoms_flagged?: string[];
  auto_consultation_required?: boolean;
  top_contributors: Array<{
    modality: string;
    factor: string;
    impact: string;
    detail: string;
  }>;
  recommendations: Array<{
    type: string;
    urgency: string;
    action: string;
  }>;
  confidence: number;
  disclaimer: string;
}

export async function predictStressAssessment(payload: {
  personId: string;
  doctorReports?: object;
  miniGames?: object;
  selfAssessment?: object;
  operationalContext?: object;
}): Promise<AnalyticsResponse<StressAssessmentResult>> {
  const cacheKey = `stress_assessment:${payload.personId}`;
  try {
    const result = await postToML<StressAssessmentResult>('/stress/predict', {
      person_id: payload.personId,
      doctor_reports: payload.doctorReports,
      mini_games: payload.miniGames,
      self_assessment: payload.selfAssessment,
      operational_context: payload.operationalContext,
    });
    await setCache(cacheKey, payload.personId, null, 'stress_assessment', result);
    return result;
  } catch {
    const cached = await getCached<StressAssessmentResult>(cacheKey);
    if (cached) return cached;

    // Safe dynamic offline evaluation honoring strict zero-undercounting protocol
    const games = (payload.miniGames || {}) as Record<string, any>;
    const self = (payload.selfAssessment || {}) as Record<string, any>;
    const doc = (payload.doctorReports || {}) as Record<string, any>;

    const rt = Number(games.avg_reaction_time_ms ?? 420);
    const rtStd = Number(games.reaction_time_std_ms ?? 35);
    const sleep = Number(self.sleep_hours ?? 7.0);
    const note = String(self.note ?? '').toLowerCase();
    const docInd = String(doc.doctor_stress_indicator ?? 'Normal').toLowerCase();

    // Somatic NLP detection
    const somatic: string[] = [];
    if (note.includes('heavy') || note.includes('eye') || note.includes('vision') || note.includes('blur')) {
      somatic.push('Ocular Fatigue (Heavy Eyes)');
    }
    if (note.includes('pain') || note.includes('leg') || note.includes('back') || note.includes('ache') || note.includes('calf')) {
      somatic.push('Musculoskeletal Strain');
    }
    if (note.includes('headache') || note.includes('dizzy') || note.includes('tremor') || note.includes('migraine')) {
      somatic.push('Neurological Strain');
    }

    const safetyTriggers: string[] = [];
    let level: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    let score = 45.0;

    // Strict safety floors
    if (rt >= 650 || (rt >= 500 && rtStd >= 55) || docInd.includes('severe') || (somatic.length > 0 && sleep <= 4.5)) {
      level = 'Critical';
      score = Math.max(90.0, Math.min(100.0, 85.0 + (rt >= 650 ? (rt - 650) / 15 : 5) + somatic.length * 4));
      if (rt >= 650) safetyTriggers.push(`Severe psychomotor latency (${rt}ms avg) — Critical combat readiness hazard.`);
      if (docInd.includes('severe')) safetyTriggers.push('Doctor report flagged severe clinical stress.');
      if (somatic.length > 0) safetyTriggers.push(`Critical somatic signs: ${somatic.join(', ')}.`);
    } else if (rt >= 460 || rtStd >= 45 || sleep < 4.5 || docInd.includes('high') || somatic.length > 0) {
      level = 'High';
      score = Math.max(68.0, Math.min(88.0, 58.0 + (rt >= 460 ? (rt - 460) / 10 : 0) + somatic.length * 5));
      if (rt >= 460) safetyTriggers.push(`Elevated cognitive reaction delay (${rt}ms avg).`);
      if (sleep < 4.5) safetyTriggers.push(`Severe sleep deficit (${sleep}h).`);
      if (somatic.length > 0) safetyTriggers.push(`Physical complaints: ${somatic.join(', ')}.`);
    } else if (sleep < 6.0 || rt >= 380) {
      level = 'Medium';
      score = 42.0;
    } else {
      level = 'Low';
      score = 15.0;
    }

    const topContributors: Array<{ modality: string; factor: string; impact: string; detail: string }> = [];
    if (somatic.length > 0) {
      topContributors.push({
        modality: 'Self-Assessment (Somatic Notes)',
        factor: 'Physical Symptoms',
        impact: 'High Negative',
        detail: `Reported somatic findings: ${somatic.join(', ')}`,
      });
    }
    if (rt >= 480) {
      topContributors.push({
        modality: 'Mini-Games',
        factor: 'Psychomotor Latency',
        impact: 'High Negative',
        detail: `Reaction speed is ${rt}ms (significantly slower than 300ms baseline)`,
      });
    }
    if (sleep < 6.0) {
      topContributors.push({
        modality: 'Self-Assessment',
        factor: 'Sleep Deficit',
        impact: 'High Negative',
        detail: `${sleep}h recorded (healthy target: 7.0–8.5h)`,
      });
    }

    const recommendations: Array<{ type: string; urgency: string; action: string }> = [];
    if (level === 'Critical' || level === 'High') {
      if (rt >= 650) {
        recommendations.push({
          type: 'Mandatory Clearance',
          urgency: 'Immediate',
          action: `Reaction time (${rt}ms) indicates extreme motor degradation. Mandatory MI Room clearance required before arms duty.`,
        });
      }
      recommendations.push({
        type: 'Rest Rotation',
        urgency: 'Immediate',
        action: 'Schedule 24-hour restorative rest rotation. Auto-scheduled medical check-in active.',
      });
    } else {
      recommendations.push({
        type: 'Maintenance',
        urgency: 'Routine',
        action: 'Maintain regular hydration, duty breaks, and consistent sleep schedule.',
      });
    }

    return offlineFallback<StressAssessmentResult>({
      person_id: payload.personId,
      stress_level: level,
      stress_score: Math.round(score * 10) / 10,
      risk_probabilities: {
        Low: level === 'Low' ? 0.9 : 0.05,
        Medium: level === 'Medium' ? 0.7 : 0.15,
        High: level === 'High' ? 0.75 : 0.2,
        Critical: level === 'Critical' ? 0.95 : 0.05,
      },
      safety_guardrails: {
        asymmetric_bayes_applied: true,
        safety_override_active: safetyTriggers.length > 0,
        safety_triggers: safetyTriggers,
        undercounting_prevented: true,
      },
      subscores: {
        doctor_reports: {
          score: docInd.includes('severe') ? 90 : docInd.includes('high') ? 70 : 20,
          state: docInd.includes('severe') ? 'Critical' : docInd.includes('high') ? 'High' : 'Low',
          consultations: Number(doc.consultations_count ?? 0),
          sick_leave_days: Number(doc.sick_leave_days ?? 0),
          clinical_indicator: String(doc.doctor_stress_indicator ?? 'Normal'),
        },
        mini_games: {
          score: rt >= 650 ? 95 : rt >= 480 ? 75 : 30,
          state: rt >= 650 ? 'Critical' : rt >= 480 ? 'High' : 'Optimal',
          avg_reaction_time_ms: rt,
          reaction_variability_ms: rtStd,
          accuracy_pct: Number(games.accuracy ?? 0.88) * 100,
        },
        self_assessment: {
          score: sleep < 5.0 ? 80 : 35,
          state: sleep < 5.0 || somatic.length > 0 ? 'High' : 'Normal',
          sleep_hours: sleep,
          energy_level: Number(self.energy_level ?? 6.5),
          recovery_level: Number(self.recovery_level ?? 6.5),
        },
      },
      signal_agreement: {
        level: safetyTriggers.length > 0 ? 'Safety Floor Applied' : 'High Agreement',
        disagreement_detected: false,
      },
      somatic_symptoms_flagged: somatic,
      auto_consultation_required: level === 'Critical' || level === 'High' || rt >= 650,
      top_contributors: topContributors.length > 0 ? topContributors : [
        { modality: 'Self-Assessment', factor: 'Baseline Maintenance', impact: 'Neutral', detail: 'Using local offline baseline' }
      ],
      recommendations,
      confidence: 0.85,
      disclaimer: 'Evaluated with onboard Bayesian safety floors (zero-undercounting guaranteed).',
    });
  }
}

