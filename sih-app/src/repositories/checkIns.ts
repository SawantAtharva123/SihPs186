import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';
import { DailyCheckInRecord } from '../types/sahayak';

export async function insertCheckIn(data: Omit<DailyCheckInRecord, 'id' | 'syncStatus' | 'timestamp'>): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const clientId = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  const personId = 'person-001'; // In real app: from auth session
  await db.runAsync(
    `INSERT INTO check_ins (id, client_id, person_id, date, sleep_compared, workload_compared, energy_level, recovery_feeling, note, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [id, clientId, personId, data.date, data.sleepCompared, data.workloadCompared, data.energyLevel, data.recoveryFeeling, data.note ?? null, now, now, now]
  );
  await enqueue('check_ins', id, 'INSERT', { id, person_id: personId, ...data });
  return id;
}

export async function getCheckInsForPerson(personId: string, days: number = 30): Promise<any[]> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return await db.getAllAsync(
    'SELECT * FROM check_ins WHERE person_id = ? AND date >= ? ORDER BY date DESC',
    [personId, cutoff.toISOString().split('T')[0]]
  );
}

export async function getTodayCheckIn(personId: string): Promise<any | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return await db.getFirstAsync('SELECT * FROM check_ins WHERE person_id = ? AND date = ?', [personId, today]);
}
