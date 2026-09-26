import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';

export async function submitPulse(
  personId: string,
  unitId: string,
  data: {
    recoveryTrend: string;
    workloadIndex: number;
    scheduleVolatility: string;
    isAnonymous: boolean;
  }
): Promise<void> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO unit_pulses (id, client_id, person_id, unit_id, recovery_trend, workload_index, schedule_volatility, is_anonymous, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [
      id,
      id,
      data.isAnonymous ? 'anon' : personId,
      unitId,
      data.recoveryTrend,
      data.workloadIndex,
      data.scheduleVolatility,
      data.isAnonymous ? 1 : 0,
      now,
      now,
      now,
    ]
  );
  await enqueue('unit_pulses', id, 'INSERT', { id, unit_id: unitId, ...data });
}

export async function submitFeedback(
  personId: string,
  unitId: string,
  data: {
    category: string;
    content: string;
    isAnonymous: boolean;
    requestWelfareFollowUp: boolean;
  }
): Promise<void> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO personnel_feedback (id, client_id, person_id, unit_id, category, content, is_anonymous, request_welfare_follow_up, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [
      id,
      id,
      data.isAnonymous ? 'anon' : personId,
      unitId,
      data.category,
      data.content,
      data.isAnonymous ? 1 : 0,
      data.requestWelfareFollowUp ? 1 : 0,
      now,
      now,
      now,
    ]
  );
  await enqueue('personnel_feedback', id, 'INSERT', { id, unit_id: unitId, ...data });
}
