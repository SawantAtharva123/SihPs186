import { getDatabase } from '../offline/database';

export async function getProfile(personId: string): Promise<any | null> {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM profiles WHERE person_id = ?', [personId]);
}

export async function upsertProfile(data: {
  personId: string;
  name: string;
  serviceNumber: string;
  rank: string;
  unitId: string;
  role: string;
  email: string;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Math.random().toString(36).substring(2);
  await db.runAsync(
    `INSERT OR REPLACE INTO profiles (id, client_id, person_id, name, service_number, rank, unit_id, role, email, created_at, updated_at, sync_status, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [id, id, data.personId, data.name, data.serviceNumber, data.rank, data.unitId, data.role, data.email, now, now, now]
  );
}
