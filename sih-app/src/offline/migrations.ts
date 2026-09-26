import * as SQLite from 'expo-sqlite';

/**
 * Runs forward-only, version-gated migrations using PRAGMA user_version.
 * Add a new `if (version < N)` block for every future schema change —
 * never modify existing blocks so that already-deployed devices upgrade cleanly.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = result?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      -- ─────────────────────────────────────────────────────────────────────
      -- Reference / identity tables
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS profiles (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        name              TEXT,
        service_number    TEXT,
        rank              TEXT,
        unit_id           TEXT,
        role              TEXT,
        email             TEXT,
        avatar            TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS units (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        name              TEXT,
        type              TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Observation / capture tables
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS duty_records (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        date              TEXT,
        start_time        TEXT,
        end_time          TEXT,
        duration_hours    REAL,
        shift_type        TEXT,
        is_night          INTEGER DEFAULT 0,
        notes             TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS sleep_records (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        date              TEXT,
        duration_hours    REAL,
        quality           TEXT,
        notes             TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS recovery_records (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        date              TEXT,
        score             REAL,
        notes             TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS check_ins (
        id                    TEXT PRIMARY KEY,
        client_id             TEXT UNIQUE,
        person_id             TEXT,
        date                  TEXT,
        sleep_compared        TEXT,
        workload_compared     TEXT,
        energy_level          TEXT,
        recovery_feeling      TEXT,
        note                  TEXT,
        created_at            TEXT,
        updated_at            TEXT,
        sync_status           TEXT DEFAULT 'pending',
        sync_attempts         INTEGER DEFAULT 0,
        last_sync_error       TEXT,
        device_timestamp      TEXT,
        server_timestamp      TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Activity / cognitive assessment tables
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS activity_sessions (
        id                        TEXT PRIMARY KEY,
        client_id                 TEXT UNIQUE,
        person_id                 TEXT,
        activity_type             TEXT,
        difficulty                TEXT,
        start_time                TEXT,
        end_time                  TEXT,
        duration_ms               INTEGER,
        score                     REAL,
        accuracy                  REAL,
        avg_reaction_time_ms      REAL,
        reaction_variability_ms   REAL,
        correct_answers           INTEGER,
        incorrect_answers         INTEGER,
        missed_answers            INTEGER,
        created_at                TEXT,
        updated_at                TEXT,
        sync_status               TEXT DEFAULT 'pending',
        sync_attempts             INTEGER DEFAULT 0,
        last_sync_error           TEXT,
        device_timestamp          TEXT,
        server_timestamp          TEXT
      );

      CREATE TABLE IF NOT EXISTS activity_attempts (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        session_id        TEXT,
        attempt_number    INTEGER,
        stimulus          TEXT,
        response          TEXT,
        reaction_time_ms  REAL,
        correct           INTEGER DEFAULT 0,
        timestamp         TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Welfare / support tables
      -- ─────────────────────────────────────────────────────────────────────
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

      CREATE TABLE IF NOT EXISTS unit_pulses (
        id                    TEXT PRIMARY KEY,
        client_id             TEXT UNIQUE,
        person_id             TEXT,
        unit_id               TEXT,
        recovery_trend        TEXT,
        workload_index        REAL,
        schedule_volatility   TEXT,
        is_anonymous          INTEGER DEFAULT 1,
        created_at            TEXT,
        updated_at            TEXT,
        sync_status           TEXT DEFAULT 'pending',
        sync_attempts         INTEGER DEFAULT 0,
        last_sync_error       TEXT,
        device_timestamp      TEXT,
        server_timestamp      TEXT
      );

      CREATE TABLE IF NOT EXISTS personnel_feedback (
        id                          TEXT PRIMARY KEY,
        client_id                   TEXT UNIQUE,
        person_id                   TEXT,
        unit_id                     TEXT,
        category                    TEXT,
        content                     TEXT,
        is_anonymous                INTEGER DEFAULT 1,
        request_welfare_follow_up   INTEGER DEFAULT 0,
        status                      TEXT DEFAULT 'Submitted',
        created_at                  TEXT,
        updated_at                  TEXT,
        sync_status                 TEXT DEFAULT 'pending',
        sync_attempts               INTEGER DEFAULT 0,
        last_sync_error             TEXT,
        device_timestamp            TEXT,
        server_timestamp            TEXT
      );

      CREATE TABLE IF NOT EXISTS medical_records (
        id                      TEXT PRIMARY KEY,
        client_id               TEXT UNIQUE,
        person_id               TEXT,
        date                    TEXT,
        doctor_name             TEXT,
        facility                TEXT,
        consultation_type       TEXT,
        diagnosis               TEXT,
        clinical_notes          TEXT,
        stress_indicator        TEXT DEFAULT 'Normal',
        recommended_rest_days   INTEGER DEFAULT 0,
        fit_for_duty            INTEGER DEFAULT 1,
        file_name               TEXT,
        created_at              TEXT,
        updated_at              TEXT,
        sync_status             TEXT DEFAULT 'pending',
        sync_attempts           INTEGER DEFAULT 0,
        last_sync_error         TEXT,
        device_timestamp        TEXT,
        server_timestamp        TEXT
      );

      CREATE TABLE IF NOT EXISTS welfare_cases (
        id                    TEXT PRIMARY KEY,
        client_id             TEXT UNIQUE,
        person_id             TEXT,
        officer_id            TEXT,
        status                TEXT DEFAULT 'New',
        reason_category       TEXT,
        observed_pattern      TEXT,
        possible_contributors TEXT,
        officer_notes         TEXT,
        follow_up_date        TEXT,
        priority              TEXT DEFAULT 'Routine',
        created_at            TEXT,
        updated_at            TEXT,
        sync_status           TEXT DEFAULT 'pending',
        sync_attempts         INTEGER DEFAULT 0,
        last_sync_error       TEXT,
        device_timestamp      TEXT,
        server_timestamp      TEXT
      );

      CREATE TABLE IF NOT EXISTS interventions (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        case_id           TEXT,
        person_id         TEXT,
        officer_id        TEXT,
        intervention_type TEXT,
        planned_date      TEXT,
        start_date        TEXT,
        end_date          TEXT,
        status            TEXT DEFAULT 'Planned',
        notes             TEXT,
        recovery_before   REAL,
        recovery_after    REAL,
        outcome_status    TEXT DEFAULT 'Pending',
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS intervention_followups (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        intervention_id   TEXT,
        date              TEXT,
        sleep_arrow       TEXT,
        recovery_arrow    TEXT,
        workload_arrow    TEXT,
        activity_arrow    TEXT,
        notes             TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Notification / audit tables
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS notifications (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        title             TEXT,
        body              TEXT,
        type              TEXT,
        is_read           INTEGER DEFAULT 0,
        action_url        TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id                TEXT PRIMARY KEY,
        client_id         TEXT UNIQUE,
        person_id         TEXT,
        action            TEXT,
        entity_type       TEXT,
        entity_id         TEXT,
        details           TEXT,
        created_at        TEXT,
        updated_at        TEXT,
        sync_status       TEXT DEFAULT 'pending',
        sync_attempts     INTEGER DEFAULT 0,
        last_sync_error   TEXT,
        device_timestamp  TEXT,
        server_timestamp  TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Infrastructure tables
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS sync_queue (
        id          TEXT PRIMARY KEY,
        table_name  TEXT,
        row_id      TEXT,
        operation   TEXT,
        payload     TEXT,
        priority    INTEGER DEFAULT 0,
        created_at  TEXT,
        attempts    INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS analytics_cache (
        key            TEXT PRIMARY KEY,
        person_id      TEXT,
        unit_id        TEXT,
        kind           TEXT,
        payload        TEXT,
        confidence     REAL,
        model_version  TEXT,
        generated_at   TEXT,
        stale          INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        key        TEXT PRIMARY KEY,
        value      TEXT,
        updated_at TEXT
      );

      -- ─────────────────────────────────────────────────────────────────────
      -- Indexes for common query patterns
      -- ─────────────────────────────────────────────────────────────────────
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

      CREATE INDEX IF NOT EXISTS idx_duty_records_person_date        ON duty_records        (person_id, date);
      CREATE INDEX IF NOT EXISTS idx_sleep_records_person_date       ON sleep_records       (person_id, date);
      CREATE INDEX IF NOT EXISTS idx_recovery_records_person_date    ON recovery_records    (person_id, date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_person_date           ON check_ins           (person_id, date);
      CREATE INDEX IF NOT EXISTS idx_activity_sessions_person        ON activity_sessions   (person_id);
      CREATE INDEX IF NOT EXISTS idx_activity_attempts_session       ON activity_attempts   (session_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_person_read       ON notifications       (person_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_welfare_cases_person            ON welfare_cases       (person_id);
      CREATE INDEX IF NOT EXISTS idx_interventions_case              ON interventions       (case_id);
      CREATE INDEX IF NOT EXISTS idx_intervention_followups_interv   ON intervention_followups (intervention_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority_created     ON sync_queue          (priority DESC, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_analytics_cache_person          ON analytics_cache     (person_id);
      CREATE INDEX IF NOT EXISTS idx_medical_records_person          ON medical_records     (person_id, date);
    `);

    await db.execAsync('PRAGMA user_version = 1;');
  }

  // Version 2: Ensure medical_records exists on existing databases
  if (version < 2) {
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
    `);

    await db.execAsync('PRAGMA user_version = 2;');
  }
}
