import { getDatabase } from '../offline/database';

export interface PersonDataExport {
  exported_at: string;
  person_id: string;
  data: {
    check_ins: unknown[];
    sleep_records: unknown[];
    duty_records: unknown[];
    recovery_records: unknown[];
    activity_sessions: unknown[];
    activity_attempts: unknown[];
    support_requests: unknown[];
    personnel_feedback: unknown[];
  };
}

/**
 * Collects all locally stored records for a person across every capture table
 * and returns them as a plain object suitable for JSON serialisation / export.
 *
 * Note: welfare_cases, interventions and audit_logs are intentionally excluded
 * from personal exports; they are handled separately by officers.
 */
export async function exportPersonData(personId: string): Promise<PersonDataExport> {
  const db = await getDatabase();

  const [
    checkIns,
    sleepRecords,
    dutyRecords,
    recoveryRecords,
    activitySessions,
    activityAttempts,
    supportRequests,
    personnelFeedback,
  ] = await Promise.all([
    db.getAllAsync('SELECT * FROM check_ins WHERE person_id = ?', [personId]),
    db.getAllAsync('SELECT * FROM sleep_records WHERE person_id = ?', [personId]),
    db.getAllAsync('SELECT * FROM duty_records WHERE person_id = ?', [personId]),
    db.getAllAsync('SELECT * FROM recovery_records WHERE person_id = ?', [personId]),
    db.getAllAsync('SELECT * FROM activity_sessions WHERE person_id = ?', [personId]),
    db.getAllAsync(
      `SELECT aa.* FROM activity_attempts aa
       JOIN activity_sessions ase ON aa.session_id = ase.id
       WHERE ase.person_id = ?`,
      [personId],
    ),
    db.getAllAsync('SELECT * FROM support_requests WHERE person_id = ?', [personId]),
    db.getAllAsync('SELECT * FROM personnel_feedback WHERE person_id = ?', [personId]),
  ]);

  return {
    exported_at: new Date().toISOString(),
    person_id: personId,
    data: {
      check_ins: checkIns,
      sleep_records: sleepRecords,
      duty_records: dutyRecords,
      recovery_records: recoveryRecords,
      activity_sessions: activitySessions,
      activity_attempts: activityAttempts,
      support_requests: supportRequests,
      personnel_feedback: personnelFeedback,
    },
  };
}
