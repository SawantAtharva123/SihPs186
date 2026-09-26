import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';

export async function insertActivitySession(data: {
  activityType: string;
  difficulty: string;
  durationMs: number;
  score: number;
  accuracy: number;
  avgReactionTimeMs: number;
  reactionVariabilityMs: number;
  correctAnswers: number;
  incorrectAnswers: number;
  missedAnswers: number;
}): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const clientId = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  const personId = 'person-001';
  await db.runAsync(
    `INSERT INTO activity_sessions (id, client_id, person_id, activity_type, difficulty, start_time, end_time, duration_ms, score, accuracy, avg_reaction_time_ms, reaction_variability_ms, correct_answers, incorrect_answers, missed_answers, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [id, clientId, personId, data.activityType, data.difficulty, now, now, data.durationMs, data.score, data.accuracy, data.avgReactionTimeMs, data.reactionVariabilityMs, data.correctAnswers, data.incorrectAnswers, data.missedAnswers, now, now, now]
  );
  await enqueue('activity_sessions', id, 'INSERT', { id, person_id: personId, ...data });
  return id;
}

export async function getTodaySessions(personId: string): Promise<any[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return await db.getAllAsync(
    'SELECT * FROM activity_sessions WHERE person_id = ? AND date(start_time) = ? ORDER BY start_time DESC',
    [personId, today]
  );
}

export async function getRecentSessions(personId: string, days: number = 30): Promise<any[]> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return await db.getAllAsync(
    'SELECT * FROM activity_sessions WHERE person_id = ? AND start_time >= ? ORDER BY start_time DESC',
    [personId, cutoff.toISOString()]
  );
}

export async function insertAttempt(
  sessionId: string,
  data: {
    attemptNumber: number;
    stimulus: string;
    response: string;
    reactionTimeMs: number;
    correct: boolean;
  }
): Promise<void> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO activity_attempts (id, client_id, session_id, attempt_number, stimulus, response, reaction_time_ms, correct, timestamp, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [id, id, sessionId, data.attemptNumber, data.stimulus, data.response, data.reactionTimeMs, data.correct ? 1 : 0, now, now, now, now]
  );
}

/** Returns up to `limit` most-recent sessions for a person, optionally filtered by activityType. */
export async function getGameScoreHistory(
  personId: string,
  activityType?: string,
  limit: number = 20,
): Promise<Array<{
  id: string;
  activity_type: string;
  start_time: string;
  duration_ms: number;
  score: number;
  accuracy: number;
  avg_reaction_time_ms: number;
  correct_answers: number;
  incorrect_answers: number;
}>> {
  const db = await getDatabase();
  if (activityType) {
    return await db.getAllAsync(
      `SELECT id, activity_type, start_time, duration_ms, score, accuracy,
              avg_reaction_time_ms, correct_answers, incorrect_answers
         FROM activity_sessions
        WHERE person_id = ? AND activity_type = ?
        ORDER BY start_time DESC
        LIMIT ?`,
      [personId, activityType, limit],
    );
  }
  return await db.getAllAsync(
    `SELECT id, activity_type, start_time, duration_ms, score, accuracy,
            avg_reaction_time_ms, correct_answers, incorrect_answers
       FROM activity_sessions
      WHERE person_id = ?
      ORDER BY start_time DESC
      LIMIT ?`,
    [personId, limit],
  );
}

/** Returns the single best score (max score) per activity type for a person. */
export async function getTopScores(
  personId: string,
): Promise<Array<{ activity_type: string; best_score: number; attempts: number }>> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT activity_type,
            MAX(score) AS best_score,
            COUNT(*)   AS attempts
       FROM activity_sessions
      WHERE person_id = ?
      GROUP BY activity_type
      ORDER BY best_score DESC`,
    [personId],
  );
}

