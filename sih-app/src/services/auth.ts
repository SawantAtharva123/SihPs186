import { getDatabase } from '../offline/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'personnel' | 'welfare_officer' | 'command_admin';
  unit: string;
  serviceNumber: string;
  rank: string;
}

interface DemoAccount {
  password: string;
  user: AuthUser;
}

/** Hard-coded demo accounts — no network required. */
const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  'rohan@sahayak.demo': {
    password: 'demo1234',
    user: {
      id: 'person-001',
      email: 'rohan@sahayak.demo',
      name: 'Rohan Verma',
      role: 'personnel',
      unit: 'Unit 402',
      serviceNumber: 'SV-104',
      rank: 'Corporal',
    },
  },
  'meera@sahayak.demo': {
    password: 'demo1234',
    user: {
      id: 'officer-001',
      email: 'meera@sahayak.demo',
      name: 'Capt. Meera Nair',
      role: 'welfare_officer',
      unit: 'Unit 402',
      serviceNumber: 'OFF-001',
      rank: 'Captain',
    },
  },
  'arjun@sahayak.demo': {
    password: 'demo1234',
    user: {
      id: 'cmd-001',
      email: 'arjun@sahayak.demo',
      name: 'Col. Arjun Mehta',
      role: 'command_admin',
      unit: 'Northern Command',
      serviceNumber: 'CMD-001',
      rank: 'Colonel',
    },
  },
};

const SESSION_KEY = 'sahayak_session';

/**
 * Validates credentials against the demo account list, persists the session to
 * SQLite, and writes an audit log entry.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const account = DEMO_ACCOUNTS[email.toLowerCase()];
  if (!account || account.password !== password) {
    throw new Error('Invalid email or password.');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    [SESSION_KEY, JSON.stringify(account.user), now],
  );

  // Audit log entry
  await db.runAsync(
    `INSERT INTO audit_logs
       (id, client_id, person_id, action, entity_type, entity_id, details, created_at, updated_at, device_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Math.random().toString(36).substring(2),
      Math.random().toString(36).substring(2),
      account.user.id,
      'LOGIN',
      'session',
      account.user.id,
      'Demo login',
      now,
      now,
      now,
    ],
  );

  return account.user;
}

/** Removes the persisted session from SQLite. */
export async function logout(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings WHERE key = ?', [SESSION_KEY]);
}

/** Reads the currently persisted session, or null if none exists. */
export async function getSession(): Promise<AuthUser | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SESSION_KEY],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * No-op in demo mode.  In production this would trigger a Supabase password
 * reset email flow.
 */
export async function resetPassword(email: string): Promise<void> {
  if (!DEMO_ACCOUNTS[email.toLowerCase()]) {
    throw new Error('Email not found.');
  }
  // Demo: no actual email is sent.
}

/** Flat list of demo accounts for display on the login help screen. */
export const DEMO_ACCOUNTS_LIST = Object.entries(DEMO_ACCOUNTS).map(
  ([_email, { user }]) => ({ ...user }),
);
