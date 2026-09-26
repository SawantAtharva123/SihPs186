import { useState, useCallback } from 'react';
import { getWelfareCases, insertWelfareCase, updateCaseStatus } from '../repositories/welfare';

export function useWelfareCases() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWelfareCases();
      setCases(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCase = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const id = await insertWelfareCase(data);
      await loadCases();
      return id;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadCases]);

  const changeStatus = useCallback(async (id: string, status: string) => {
    await updateCaseStatus(id, status);
    await loadCases();
  }, [loadCases]);

  return { cases, loading, error, loadCases, createCase, changeStatus };
}
