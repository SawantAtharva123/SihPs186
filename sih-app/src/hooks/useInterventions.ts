import { useState, useCallback } from 'react';
import { getInterventions, insertIntervention, addFollowup } from '../repositories/welfare';

export function useInterventions(caseId?: string) {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInterventions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInterventions(caseId);
      setInterventions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const createIntervention = useCallback(async (data: any) => {
    const id = await insertIntervention(data);
    await loadInterventions();
    return id;
  }, [loadInterventions]);

  const recordFollowup = useCallback(async (interventionId: string, data: any) => {
    await addFollowup(interventionId, data);
  }, []);

  return { interventions, loading, error, loadInterventions, createIntervention, recordFollowup };
}
