import { useState, useCallback } from 'react';
import { getTodayCheckIn, insertCheckIn } from '../repositories/checkIns';

const PERSON_ID = 'person-001';

export function useCheckIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<any | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const checkTodayStatus = useCallback(async () => {
    try {
      const ci = await getTodayCheckIn(PERSON_ID);
      setTodayCheckIn(ci);
      setHasCheckedIn(!!ci);
    } catch (e) {
      setHasCheckedIn(false);
    }
  }, []);

  const submitCheckIn = useCallback(async (data: {
    date: string;
    sleepHours?: number;
    sleepCompared?: any;
    workloadCompared: any;
    energyLevel: any;
    recoveryFeeling: any;
    note?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await insertCheckIn({
        ...data,
        sleepHours: data.sleepHours ?? 7.0,
      });
      setHasCheckedIn(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, hasCheckedIn, todayCheckIn, checkTodayStatus, submitCheckIn };
}
