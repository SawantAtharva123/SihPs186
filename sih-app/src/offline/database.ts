import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('sahayak.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await runMigrations(db);
      // Safety check to ensure medical_records table always exists even across hot-reloads
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id                       TEXT PRIMARY KEY,
          client_id                TEXT UNIQUE,
          person_id                TEXT,
          date                     TEXT,
          doctor_name              TEXT,
          facility                 TEXT,
          consultation_type        TEXT,
          diagnosis                TEXT,
          clinical_notes           TEXT,
          stress_indicator         TEXT DEFAULT 'Normal',
          recommended_rest_days    REAL DEFAULT 0,
          fit_for_duty             INTEGER DEFAULT 1,
          file_name                TEXT,
          created_at               TEXT,
          updated_at               TEXT,
          sync_status              TEXT DEFAULT 'pending',
          sync_attempts            INTEGER DEFAULT 0,
          last_sync_error          TEXT,
          device_timestamp         TEXT,
          server_timestamp         TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_medical_records_person ON medical_records (person_id, date);

        CREATE TABLE IF NOT EXISTS support_requests (
          id                TEXT PRIMARY KEY,
          client_id         TEXT UNIQUE,
          person_id         TEXT,
          category          TEXT,
          request_type      TEXT,
          is_anonymous      INTEGER DEFAULT 0,
          notes             TEXT,
          status            TEXT DEFAULT 'Submitted',
          created_at        TEXT,
          updated_at        TEXT,
          sync_status       TEXT DEFAULT 'pending',
          sync_attempts     INTEGER DEFAULT 0,
          last_sync_error   TEXT,
          device_timestamp  TEXT,
          server_timestamp  TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_support_requests_person ON support_requests (person_id, created_at);
      `);
      return db;
    })();
  }
  return _dbPromise;
}
