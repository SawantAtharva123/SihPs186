import { useState, useEffect, useCallback } from 'react';
import { useSahayak } from '@/context/SahayakContext';
import { getDatabase } from '@/offline/database';
import { getMedicalSummary, MedicalRecord } from '@/repositories/medical';
import { getGameScoreHistory } from '@/repositories/activities';
import { getTodayCheckIn } from '@/repositories/checkIns';
import {
  predictStressAssessment,
  StressAssessmentResult,
  AnalyticsResponse,
} from '@/services/analyticsClient';
import { checkAndAutoBookConsultation, getLatestAutoConsultation } from '@/services/consultationBooking';

export function useStressAssessment() {
  const { currentUser, isOffline } = useSahayak();
  const personId = currentUser?.id ?? 'person-001';

  const [assessment, setAssessment] = useState<StressAssessmentResult | null>(null);
  const [autoConsultation, setAutoConsultation] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confidence, setConfidence] = useState<number>(0.85);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();

      // 1. Fetch Doctor / Medical Reports
      const medSummary = await getMedicalSummary(personId);

      // 2. Fetch Mini-Game Performance (last 10 sessions)
      const sessions = await getGameScoreHistory(personId, undefined, 10);
      let avgRt = 450.0;
      let rtStd = 38.0;
      let acc = 0.89;
      let missed = 1.0;
      let falseTaps = 1.0;

      if (sessions.length > 0) {
        const rtValues = sessions.map((s) => s.avg_reaction_time_ms || 450.0);
        avgRt = rtValues.reduce((a, b) => a + b, 0) / rtValues.length;

        // Compute reaction time std dev
        const mean = avgRt;
        const variance =
          rtValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          Math.max(1, rtValues.length);
        rtStd = Math.sqrt(variance);

        const accValues = sessions.map((s) => s.accuracy || 0.85);
        acc = accValues.reduce((a, b) => a + b, 0) / accValues.length;

        const missedValues = sessions.map((s) => (s as any).missed_answers || 0);
        missed = missedValues.reduce((a, b) => a + b, 0) / missedValues.length;

        const incorrectValues = sessions.map((s) => (s as any).incorrect_answers || 0);
        falseTaps = incorrectValues.reduce((a, b) => a + b, 0) / incorrectValues.length;
      }

      // 3. Fetch Self-Assessment & Sleep Hours
      const todayCheckIn = await getTodayCheckIn(personId);
      const recentSleep = await db.getFirstAsync<{ duration_hours: number }>(
        'SELECT duration_hours FROM sleep_records WHERE person_id = ? ORDER BY date DESC LIMIT 1',
        [personId]
      );

      const sleepHours = recentSleep?.duration_hours ?? (todayCheckIn?.sleep_compared ? 6.5 : 7.2);
      
      const energyMap: Record<string, number> = { Low: 3.5, Mild: 5.5, Usual: 7.0, Energetic: 8.5, Peak: 9.5 };
      const recoveryMap: Record<string, number> = { Strained: 3.0, Slow: 5.0, Normal: 7.0, Restored: 8.5, 'Fully recharged': 9.5 };

      const energyLevel = energyMap[todayCheckIn?.energy_level] ?? 6.5;
      const recoveryLevel = recoveryMap[todayCheckIn?.recovery_feeling] ?? 6.5;
      const selfStress = todayCheckIn?.workload_compared === 'Much higher' ? 'High' : 'Medium';

      // 4. Operational Context (Duty hours from duty_records)
      const dutyRows = await db.getAllAsync<{ duration_hours: number; is_night: number }>(
        'SELECT duration_hours, is_night FROM duty_records WHERE person_id = ? ORDER BY date DESC LIMIT 7',
        [personId]
      );
      const weeklyHours = dutyRows.reduce((sum, r) => sum + (r.duration_hours || 8), 0);
      const nightShiftsCount = dutyRows.filter((r) => r.is_night === 1).length;

      // 5. Query ML Service with Multi-Modal Bundle
      const response: AnalyticsResponse<StressAssessmentResult> = await predictStressAssessment({
        personId,
        doctorReports: {
          consultations_count: medSummary.consultations_count,
          sick_leave_days: medSummary.sick_leave_days,
          prior_counseling_sessions: medSummary.prior_counseling_sessions,
          doctor_stress_indicator: medSummary.latest_stress_indicator,
          recommended_rest_days: medSummary.recommended_rest_days,
          fit_for_duty: medSummary.fit_for_duty,
          clinical_notes: medSummary.latest_notes,
        },
        miniGames: {
          avg_reaction_time_ms: Math.round(avgRt),
          reaction_time_std_ms: Math.round(rtStd),
          accuracy: Number(acc.toFixed(2)),
          missed_targets: Number(missed.toFixed(1)),
          false_taps: Number(falseTaps.toFixed(1)),
          sessions_count: sessions.length,
        },
        selfAssessment: {
          sleep_hours: sleepHours,
          energy_level: energyLevel,
          mood_level: energyLevel, // correlated with energy
          recovery_level: recoveryLevel,
          self_reported_stress: selfStress,
          workload_compared: todayCheckIn?.workload_compared ?? 'Usual',
          note: todayCheckIn?.note ?? undefined,
        },
        operationalContext: {
          duty_hours_per_week: weeklyHours || 48.0,
          night_shifts_per_month: nightShiftsCount * 4,
          workload_index: weeklyHours > 56 ? 0.75 : 0.45,
        },
      });

      setAssessment(response.data);
      setConfidence(response.confidence);
      setIsStale(Boolean(response.stale));
      setWarnings(response.warnings || []);

      // Check and trigger automated consultation booking for High or Critical stress
      if (
        response.data.stress_level === 'High' ||
        response.data.stress_level === 'Critical' ||
        response.data.auto_consultation_required
      ) {
        const booked = await checkAndAutoBookConsultation(personId, response.data);
        setAutoConsultation(booked);
      } else {
        const latest = await getLatestAutoConsultation(personId);
        setAutoConsultation(latest);
      }
    } catch (err) {
      console.warn('Error computing stress assessment:', err);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  return {
    assessment,
    autoConsultation,
    loading,
    confidence,
    isStale,
    warnings,
    refresh: fetchAssessment,
  };
}
