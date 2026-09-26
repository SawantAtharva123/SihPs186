import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';
import { WelfareCase, InterventionRecord } from '../types/sahayak';

export async function insertWelfareCase(data: Partial<WelfareCase> & { person_id: string }): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO welfare_cases (id, client_id, person_id, officer_id, status, reason_category, observed_pattern, possible_contributors, officer_notes, follow_up_date, priority, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [
      id,
      id,
      data.person_id,
      'officer-001',
      data.status ?? 'New',
      data.reasonCategory ?? 'Other',
      data.observedPattern ?? '',
      JSON.stringify(data.possibleContributors ?? []),
      data.officerNotes ?? '',
      data.followUpDate ?? '',
      data.priority ?? 'Routine',
      now,
      now,
      now,
    ]
  );
  await enqueue('welfare_cases', id, 'INSERT', { id, ...data });
  return id;
}

export async function getWelfareCases(officerId?: string): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM welfare_cases ORDER BY created_at DESC');
}

export async function updateCaseStatus(id: string, status: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE welfare_cases SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  await enqueue('welfare_cases', id, 'UPDATE', { id, status });
}

export async function insertIntervention(data: Partial<InterventionRecord> & { case_id: string; person_id: string }): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO interventions (id, client_id, case_id, person_id, officer_id, intervention_type, planned_date, start_date, end_date, status, notes, recovery_before, outcome_status, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [
      id,
      id,
      data.case_id,
      data.person_id,
      'officer-001',
      data.interventionType ?? 'Welfare check-in',
      data.plannedDate ?? '',
      data.startDate ?? now,
      data.endDate ?? null,
      data.status ?? 'Planned',
      data.notes ?? '',
      data.recoveryBefore ?? 0,
      'Pending',
      now,
      now,
      now,
    ]
  );
  await enqueue('interventions', id, 'INSERT', { id, ...data });
  return id;
}

export async function getInterventions(caseId?: string): Promise<any[]> {
  const db = await getDatabase();
  if (caseId) {
    return await db.getAllAsync('SELECT * FROM interventions WHERE case_id = ? ORDER BY created_at DESC', [caseId]);
  }
  return await db.getAllAsync('SELECT * FROM interventions ORDER BY created_at DESC');
}

export async function addFollowup(
  interventionId: string,
  data: {
    sleepArrow: string;
    recoveryArrow: string;
    workloadArrow: string;
    activityArrow: string;
    notes: string;
  }
): Promise<void> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO intervention_followups (id, client_id, intervention_id, date, sleep_arrow, recovery_arrow, workload_arrow, activity_arrow, notes, created_at, updated_at, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, id, interventionId, now.split('T')[0], data.sleepArrow, data.recoveryArrow, data.workloadArrow, data.activityArrow, data.notes, now, now, now]
  );
}
