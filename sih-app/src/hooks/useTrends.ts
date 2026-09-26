import { useState, useCallback } from 'react';
import { getDatabase } from '../offline/database';

const PERSON_ID = 'person-001';

export interface TrendPoint {
  date: string;
  value: number;
}

export function useTrends() {
  const [sleepTrend, setSleepTrend] = useState<TrendPoint[]>([]);
  const [recoveryTrend, setRecoveryTrend] = useState<TrendPoint[]>([]);
  const [dutyTrend, setDutyTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrends = useCallback(async (days: number = 30) => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const sleep = await db.getAllAsync<{ date: string; duration_hours: number }>(
        'SELECT date, duration_hours FROM sleep_records WHERE person_id = ? AND date >= ? ORDER BY date ASC',
        [PERSON_ID, cutoffStr]
      );
      const recovery = await db.getAllAsync<{ date: string; score: number }>(
        'SELECT date, score FROM recovery_records WHERE person_id = ? AND date >= ? ORDER BY date ASC',
        [PERSON_ID, cutoffStr]
      );
      const duty = await db.getAllAsync<{ date: string; duration_hours: number }>(
        'SELECT date, duration_hours FROM duty_records WHERE person_id = ? AND date >= ? ORDER BY date ASC',
        [PERSON_ID, cutoffStr]
      );

      setSleepTrend(sleep.map(r => ({ date: r.date, value: r.duration_hours })));
      setRecoveryTrend(recovery.map(r => ({ date: r.date, value: r.score })));
      setDutyTrend(duty.map(r => ({ date: r.date, value: r.duration_hours })));
    } finally {
      setLoading(false);
    }
  }, []);

  return { sleepTrend, recoveryTrend, dutyTrend, loading, loadTrends };
}
