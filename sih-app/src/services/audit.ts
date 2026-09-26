import { getDatabase } from '../offline/database';

/**
 * Appends an immutable audit log entry to the local database.
 *
 * Entries are marked sync_status = 'pending' so the sync queue can upload
 * them to the server when connectivity is restored.
 *
 * @param personId   - ID of the user performing the action.
 * @param action     - Verb describing the action (e.g. 'LOGIN', 'CREATE_CASE').
 * @param entityType - Domain entity involved (e.g. 'welfare_case', 'session').
 * @param entityId   - Primary key of the affected entity.
 * @param details    - Optional free-text context.
 */
export async function logAudit(
  personId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);

  await db.runAsync(
    `INSERT INTO audit_logs
       (id, client_id, person_id, action, entity_type, entity_id, details,
        created_at, updated_at, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, id, personId, action, entityType, entityId, details ?? '', now, now, now],
  );
}
