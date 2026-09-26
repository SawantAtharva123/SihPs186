import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';

export interface MedicalRecord {
  id: string;
  client_id?: string;
  person_id: string;
  date: string;
  doctor_name: string;
  facility: string;
  consultation_type: string;
  diagnosis: string;
  clinical_notes: string;
  stress_indicator: 'Normal' | 'Moderate' | 'High' | 'Severe';
  recommended_rest_days: number;
  fit_for_duty: boolean;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export async function insertMedicalRecord(data: {
  personId?: string;
  date: string;
  doctorName: string;
  facility?: string;
  consultationType: string;
  diagnosis?: string;
  clinicalNotes?: string;
  stressIndicator?: 'Normal' | 'Moderate' | 'High' | 'Severe';
  recommendedRestDays?: number;
  fitForDuty?: boolean;
  fileName?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const clientId = id;
  const now = new Date().toISOString();
  const personId = data.personId ?? 'person-001';

  await db.runAsync(
    `INSERT INTO medical_records (
      id, client_id, person_id, date, doctor_name, facility,
      consultation_type, diagnosis, clinical_notes, stress_indicator,
      recommended_rest_days, fit_for_duty, file_name, created_at, updated_at,
      sync_status, sync_attempts, device_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [
      id,
      clientId,
      personId,
      data.date,
      data.doctorName,
      data.facility ?? 'Base Hospital Medical Center',
      data.consultationType,
      data.diagnosis ?? null,
      data.clinicalNotes ?? null,
      data.stressIndicator ?? 'Normal',
      data.recommendedRestDays ?? 0,
      data.fitForDuty !== false ? 1 : 0,
      data.fileName ?? null,
      now,
      now,
      now,
    ]
  );

  await enqueue('medical_records', id, 'INSERT', { id, person_id: personId, ...data });
  return id;
}

export async function getMedicalRecordsForPerson(personId: string): Promise<MedicalRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM medical_records WHERE person_id = ? ORDER BY date DESC, created_at DESC',
    [personId]
  );
  return rows.map(r => ({
    id: r.id,
    client_id: r.client_id,
    person_id: r.person_id,
    date: r.date,
    doctor_name: r.doctor_name,
    facility: r.facility,
    consultation_type: r.consultation_type,
    diagnosis: r.diagnosis,
    clinical_notes: r.clinical_notes,
    stress_indicator: r.stress_indicator,
    recommended_rest_days: r.recommended_rest_days,
    fit_for_duty: Boolean(r.fit_for_duty),
    file_name: r.file_name,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getMedicalSummary(personId: string): Promise<{
  consultations_count: number;
  sick_leave_days: number;
  prior_counseling_sessions: number;
  latest_stress_indicator: string;
  recommended_rest_days: number;
  fit_for_duty: boolean;
  latest_notes?: string;
}> {
  const records = await getMedicalRecordsForPerson(personId);
  const consultations_count = records.length;
  const sick_leave_days = records.reduce((acc, r) => acc + (r.recommended_rest_days || 0), 0);
  const prior_counseling = records.filter(r => 
    r.consultation_type?.toLowerCase().includes('counseling') || 
    r.consultation_type?.toLowerCase().includes('psych')
  ).length;

  const latest = records[0];
  return {
    consultations_count,
    sick_leave_days,
    prior_counseling_sessions: prior_counseling,
    latest_stress_indicator: latest?.stress_indicator ?? 'Normal',
    recommended_rest_days: latest?.recommended_rest_days ?? 0,
    fit_for_duty: latest ? latest.fit_for_duty : true,
    latest_notes: latest?.clinical_notes,
  };
}
