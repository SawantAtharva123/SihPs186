import { getDatabase } from '../offline/database';

export interface Notification {
  id: string;
  person_id: string;
  title: string;
  body: string;
  type: 'info' | 'welfare' | 'activity' | 'sync';
  is_read: number;
  action_url?: string;
  created_at: string;
}

/** Returns the 20 most recent notifications for a person, newest first. */
export async function getNotifications(personId: string): Promise<Notification[]> {
  const db = await getDatabase();
  return db.getAllAsync<Notification>(
    'SELECT * FROM notifications WHERE person_id = ? ORDER BY created_at DESC LIMIT 20',
    [personId],
  );
}

/** Marks a single notification as read. */
export async function markRead(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
}

/** Marks all notifications for a person as read (e.g. on notification centre open). */
export async function markAllRead(personId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE notifications SET is_read = 1 WHERE person_id = ? AND is_read = 0',
    [personId],
  );
}

/** Inserts a new notification into the local store. */
export async function addNotification(
  personId: string,
  title: string,
  body: string,
  type: Notification['type'],
  actionUrl?: string,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  await db.runAsync(
    `INSERT INTO notifications
       (id, client_id, person_id, title, body, type, is_read, action_url,
        created_at, updated_at, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [id, id, personId, title, body, type, actionUrl ?? null, now, now, now],
  );
}

/** Returns the count of unread notifications — used for badge rendering. */
export async function getUnreadCount(personId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE person_id = ? AND is_read = 0',
    [personId],
  );
  return result?.count ?? 0;
}
