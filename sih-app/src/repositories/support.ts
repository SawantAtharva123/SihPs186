import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';

export async function submitSupportRequest(
  personId: string,
  data: {
    category: string;
    requestType: string;
    isAnonymous: boolean;
    notes: string;
  }
): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO support_requests (id, client_id, person_id, category, request_type, is_anonymous, notes, status, created_at, updated_at, sync_status, sync_attempts, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, 'pending', 0, ?)`,
    [
      id,
      id,
      data.isAnonymous ? 'anon' : personId,
      data.category,
      data.requestType,
      data.isAnonymous ? 1 : 0,
      data.notes,
      now,
      now,
      now,
    ]
  );
  await enqueue('support_requests', id, 'INSERT', { id, person_id: personId, ...data });
  return id;
}

export async function getSupportRequests(personId: string): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM support_requests WHERE person_id = ? ORDER BY created_at DESC',
    [personId]
  );
}
