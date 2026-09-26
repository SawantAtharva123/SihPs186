import { insertMedicalRecord, getMedicalRecordsForPerson, MedicalRecord } from '../repositories/medical';
import { StressAssessmentResult } from './analyticsClient';

/**
 * Service to handle automated medical consultations and operational rest advisories
 * for personnel whose stress level exceeds critical or high safety thresholds.
 */
export async function checkAndAutoBookConsultation(
  personId: string,
  assessment: StressAssessmentResult
): Promise<MedicalRecord | null> {
  const isHighOrCritical =
    assessment.stress_level === 'Critical' ||
    assessment.stress_level === 'High' ||
    Boolean(assessment.auto_consultation_required);

  if (!isHighOrCritical) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const existingRecords = await getMedicalRecordsForPerson(personId);

  // Check if an auto-consultation was already booked today to avoid duplicates
  const todayAutoBooking = existingRecords.find(
    (r) =>
      r.date === today &&
      (r.consultation_type.includes('Auto-Scheduled') || r.consultation_type.includes('MI Room Clearance'))
  );

  if (todayAutoBooking) {
    return todayAutoBooking;
  }

  // Construct clinical notes from assessment details & somatic symptoms
  const triggers = assessment.safety_guardrails?.safety_triggers ?? [];
  const somatic = assessment.somatic_symptoms_flagged ?? [];
  const rt = assessment.subscores?.mini_games?.avg_reaction_time_ms;
  const sleep = assessment.subscores?.self_assessment?.sleep_hours;

  const notesParts: string[] = [
    `AUTOMATED CLINICAL SAFETY REFERRAL (Sahayak Welfare System v2.1)`,
    `Evaluated Stress Level: ${assessment.stress_level.toUpperCase()} (Score: ${assessment.stress_score}/100)`,
  ];

  if (rt !== undefined) {
    notesParts.push(`Psychomotor Latency: ${Math.round(rt)}ms (Tactical baseline: 250-380ms)`);
  }
  if (sleep !== undefined) {
    notesParts.push(`Reported Sleep: ${sleep} hours`);
  }
  if (somatic.length > 0) {
    notesParts.push(`Flagged Somatic Symptoms: ${somatic.join(', ')}`);
  }
  if (triggers.length > 0) {
    notesParts.push(`Active Safety Triggers: ${triggers.join('; ')}`);
  }

  notesParts.push(
    `Tactical Recommendation: Temporary stand-down from high-risk duties and immediate clinical review by Duty Medical Officer.`
  );

  const clinicalNotes = notesParts.join('\n');
  const isCritical = assessment.stress_level === 'Critical';

  const recordId = await insertMedicalRecord({
    personId,
    date: today,
    doctorName: 'Duty Medical Officer (Capt. S. Nair, AMC)',
    facility: 'Unit Medical Inspection (MI) Room',
    consultationType: 'Auto-Scheduled MI Room Clearance',
    diagnosis: isCritical
      ? 'Critical Cognitive/Physical Fatigue & Latency Degradation'
      : 'Elevated Operational Stress & Fatigue Risk',
    clinicalNotes,
    stressIndicator: isCritical ? 'Severe' : 'High',
    recommendedRestDays: isCritical ? 2 : 1,
    fitForDuty: false, // Flagged pending clinical examination
  });

  const updatedRecords = await getMedicalRecordsForPerson(personId);
  return updatedRecords.find((r) => r.id === recordId) ?? null;
}

export async function getLatestAutoConsultation(personId: string): Promise<MedicalRecord | null> {
  const records = await getMedicalRecordsForPerson(personId);
  return (
    records.find(
      (r) =>
        r.consultation_type.includes('Auto-Scheduled') ||
        r.consultation_type.includes('MI Room Clearance')
    ) ?? null
  );
}
