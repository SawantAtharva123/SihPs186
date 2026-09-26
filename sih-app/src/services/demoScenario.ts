import { getDatabase } from '../offline/database';
import { DemoScenario } from '../types/sahayak';

const PERSON_ID = 'person-001';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function uid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// Day-shape type
// ─────────────────────────────────────────────────────────────────────────────

interface DayData {
  date: string;
  sleep: number;          // hours
  workload: string;       // Low | Moderate | High
  recovery: number;       // 0–100
  isNight: boolean;
  dutyHours: number;
  checkInSleep: string;   // Lower | Usual | Higher
  checkInWorkload: string;
  checkInEnergy: string;  // Low | Mild | Usual
  checkInRecovery: string; // Strained | Slow | Normal
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario generation
// ─────────────────────────────────────────────────────────────────────────────

function r(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateScenarioDays(scenario: DemoScenario): DayData[] {
  const days: DayData[] = [];

  for (let i = 60; i >= 0; i--) {
    let sleep = 7.5;
    let workload = 'Moderate';
    let recovery = 70;
    let isNight = false;
    let dutyHours = 8;

    switch (scenario) {
      case 'scenario_a_stable':
        sleep = r(7, 8.5);
        recovery = r(65, 85);
        isNight = i % 7 === 0;
        dutyHours = r(7.5, 9);
        break;

      case 'scenario_b_emerging_change':
        if (i < 10) {
          sleep = r(5.5, 6.5);
          isNight = i % 2 === 0;
          recovery = r(50, 65);
          workload = 'High';
          dutyHours = r(9, 11);
        } else {
          sleep = r(7, 8.5);
          recovery = r(70, 85);
          dutyHours = r(7.5, 9);
        }
        break;

      case 'scenario_c_persistent_deviation':
        if (i < 21) {
          sleep = r(4.5, 5.5);
          isNight = i % 3 < 2;
          recovery = r(35, 55);
          workload = 'High';
          dutyHours = r(11, 13);
        } else {
          sleep = r(7, 8.5);
          recovery = r(70, 85);
        }
        break;

      case 'scenario_d_conflicting_signals':
        // High intra-day variability — signals disagree with each other
        sleep = r(5, 8);
        isNight = Math.random() > 0.5;
        recovery = r(40, 80);
        workload = (['Low', 'High', 'Moderate'] as const)[Math.floor(Math.random() * 3)];
        dutyHours = r(6, 12);
        break;

      case 'scenario_e_recovery_journey':
        if (i > 30) {
          sleep = r(4.5, 5.5);
          isNight = i % 3 < 2;
          recovery = r(30, 50);
          workload = 'High';
          dutyHours = r(11, 13);
        } else if (i > 15) {
          sleep = r(5.5, 6.5);
          recovery = r(45, 65);
          workload = 'Moderate';
          dutyHours = r(8, 10);
        } else {
          sleep = r(7, 8.5);
          recovery = r(65, 85);
          dutyHours = r(7.5, 9);
        }
        break;

      case 'scenario_f_high_volatility':
        // Very wide swings — extreme duty schedules
        sleep = r(3, 8);
        isNight = Math.random() > 0.4;
        recovery = r(20, 80);
        workload = (['Low', 'Moderate', 'High', 'High'] as const)[Math.floor(Math.random() * 4)];
        dutyHours = r(6, 14);
        break;
    }

    // Round to 1 dp
    sleep = Math.round(sleep * 10) / 10;
    recovery = Math.round(recovery);
    dutyHours = Math.round(dutyHours * 10) / 10;

    // Derive check-in qualitative values from numeric data
    const checkInSleep: string =
      sleep < 6 ? 'Lower' : sleep < 7 ? 'Usual' : 'Higher';
    const checkInWorkload: string =
      workload === 'High' ? 'Higher' : workload === 'Low' ? 'Lower' : 'Usual';
    const checkInEnergy: string =
      recovery < 45 ? 'Low' : recovery < 60 ? 'Mild' : 'Usual';
    const checkInRecovery: string =
      recovery < 45 ? 'Strained' : recovery < 60 ? 'Slow' : 'Normal';

    days.push({
      date: dateStr(i),
      sleep,
      workload,
      recovery,
      isNight,
      dutyHours,
      checkInSleep,
      checkInWorkload,
      checkInEnergy,
      checkInRecovery,
    });
  }

  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clears existing seeded records for the demo person and inserts 61 days
 * (today − 60 … today) of synthetic data matching the chosen scenario.
 *
 * Check-ins are omitted ~30 % of the time for realism (personnel don't always
 * complete the daily check-in).
 */
export async function seedDemoScenario(scenario: DemoScenario): Promise<void> {
  const db = await getDatabase();

  // Wipe previous seed data first
  await Promise.all([
    db.runAsync('DELETE FROM check_ins WHERE person_id = ?', [PERSON_ID]),
    db.runAsync('DELETE FROM sleep_records WHERE person_id = ?', [PERSON_ID]),
    db.runAsync('DELETE FROM duty_records WHERE person_id = ?', [PERSON_ID]),
    db.runAsync('DELETE FROM recovery_records WHERE person_id = ?', [PERSON_ID]),
  ]);

  const days = generateScenarioDays(scenario);
  const now = new Date().toISOString();

  for (const d of days) {
    // Sleep record
    await db.runAsync(
      `INSERT OR IGNORE INTO sleep_records
         (id, client_id, person_id, date, duration_hours, quality,
          created_at, updated_at, sync_status, device_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid(), uid(), PERSON_ID, d.date, d.sleep,
        d.sleep >= 7 ? 'Good' : d.sleep >= 5.5 ? 'Fair' : 'Poor',
        now, now, 'synced', now,
      ],
    );

    // Recovery record
    await db.runAsync(
      `INSERT OR IGNORE INTO recovery_records
         (id, client_id, person_id, date, score,
          created_at, updated_at, sync_status, device_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uid(), uid(), PERSON_ID, d.date, d.recovery, now, now, 'synced', now],
    );

    // Duty record
    await db.runAsync(
      `INSERT OR IGNORE INTO duty_records
         (id, client_id, person_id, date, duration_hours, shift_type, is_night,
          created_at, updated_at, sync_status, device_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid(), uid(), PERSON_ID, d.date,
        d.dutyHours,
        d.isNight ? 'night' : 'day',
        d.isNight ? 1 : 0,
        now, now, 'synced', now,
      ],
    );

    // Check-in — skip ~30 % for realism
    if (Math.random() > 0.3) {
      await db.runAsync(
        `INSERT OR IGNORE INTO check_ins
           (id, client_id, person_id, date,
            sleep_compared, workload_compared, energy_level, recovery_feeling,
            created_at, updated_at, sync_status, device_timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uid(), uid(), PERSON_ID, d.date,
          d.checkInSleep, d.checkInWorkload, d.checkInEnergy, d.checkInRecovery,
          now, now, 'synced', now,
        ],
      );
    }
  }
}

/** Human-readable label for each scenario (used in UI pickers). */
export function getScenarioLabel(scenario: DemoScenario): string {
  const labels: Record<DemoScenario, string> = {
    scenario_a_stable:              'A — Stable Baseline',
    scenario_b_emerging_change:     'B — Emerging Change',
    scenario_c_persistent_deviation:'C — Persistent Deviation',
    scenario_d_conflicting_signals: 'D — Conflicting Signals',
    scenario_e_recovery_journey:    'E — Recovery Journey',
    scenario_f_high_volatility:     'F — High Volatility',
  };
  return labels[scenario];
}
