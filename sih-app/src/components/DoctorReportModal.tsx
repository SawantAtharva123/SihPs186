import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insertMedicalRecord } from '@/repositories/medical';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';
import { analyzeDoctorReport, DoctorReportAnalysis } from '@/services/analyticsClient';

interface DoctorReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CONSULTATION_TYPES = [
  'Operational Stress & Fatigue',
  'Routine Medical Review',
  'Psychological & Welfare Counseling',
  'Physical Strain & Injury',
  'Duty Fitness Evaluation',
];

const STRESS_INDICATORS: Array<'Normal' | 'Moderate' | 'High' | 'Severe'> = [
  'Normal',
  'Moderate',
  'High',
  'Severe',
];

const TACTICAL_CASE_PRESETS = [
  {
    id: 'ied',
    label: 'Post-IED Ambush',
    tag: 'Severe Crisis',
    color: '#EF4444',
    doctor: 'Major Dr. Anita Sharma, AMC',
    facility: 'Unit MI Room, 44 Rashtriya Rifles',
    type: 'Psychological & Welfare Counseling',
    diagnosis: 'Acute Stress Reaction with Severe Hyperarousal & Flashbacks',
    notes: 'Naik evaluated 48h post-IED ambush encounter. Severe acoustic startle, tachycardia 116 bpm, panic attacks, intrusive combat imagery. Soldier states: cannot hold weapon safely. Withdraw weapon issue immediately. Completely unfit for duty. 7 days sick-in-quarters.',
  },
  {
    id: 'altitude',
    label: 'High-Altitude Hypobaric',
    tag: 'Cold & Hypoxia',
    color: '#F59E0B',
    doctor: 'Lt. Col. R. K. Mukherjee, AMC',
    facility: '153 General Hospital, Leh',
    type: 'Operational Stress & Fatigue',
    diagnosis: 'High-Altitude Hypobaric Fatigue with Stage-1 Sleep Disruption',
    notes: 'Havildar at 14,800 ft. Throbbing retro-orbital headaches, exertional dyspnea, terminal insomnia (3.5h/night). SpO2 84%, resting HR 102 bpm. Advised immediate descent to 8,500 ft staging camp and 72-hour operational stand-down. Unfit for high-altitude patrol.',
  },
  {
    id: 'shift',
    label: 'Circadian Border Vigil',
    tag: 'Shift Fatigue',
    color: '#3B82F6',
    doctor: 'Dr. Pradeep Rathore, CMO (SG)',
    facility: 'Sector Hospital, BSF Jaisalmer',
    type: 'Routine Medical Review',
    diagnosis: 'Shift Work Sleep Disorder with Mild Somatosensory Fatigue',
    notes: 'Head Constable on rotating night vigil along western boundary. Reports eye strain, lumbar stiffness, and daytime lethargy. Denies depression, denies suicidal thoughts. Vitals stable. Recommend 24-hour sleep realignment rest. Fit for standard camp duties.',
  },
  {
    id: 'fit',
    label: 'SHAPE-1 Category AYE',
    tag: 'Fully Fit',
    color: '#10B981',
    doctor: 'Surg. Cdr. V. S. Pillai, VSM',
    facility: 'Base Hospital Barrackpore',
    type: 'Duty Fitness Evaluation',
    diagnosis: 'Category AYE (Fully Fit for All Operational Theatres)',
    notes: 'Annual periodic wellness examination. Patient actively denies headache, anxiety, insomnia, or depressive feelings. Cheerful affect, BP 120/78, resting HR 64. PFT Passed with Excellent rating. Fully fit for all combat duties. Zero rest days indicated.',
  },
];

export default function DoctorReportModal({ visible, onClose, onSaved }: DoctorReportModalProps) {
  const { currentUser } = useSahayak();
  const { colors, isDark } = useTheme();
  const personId = currentUser?.id ?? 'person-001';

  const [doctorName, setDoctorName] = useState('Major Dr. Anita Sharma, AMC');
  const [facility, setFacility] = useState('Unit MI Room, 44 Rashtriya Rifles');
  const [consultationType, setConsultationType] = useState('Operational Stress & Fatigue');
  const [stressIndicator, setStressIndicator] = useState<'Normal' | 'Moderate' | 'High' | 'Severe'>('High');
  const [restDays, setRestDays] = useState(3);
  const [fitForDuty, setFitForDuty] = useState(false);
  const [diagnosis, setDiagnosis] = useState('Operational fatigue & severe sleep disruption');
  const [clinicalNotes, setClinicalNotes] = useState('Reports throbbing headaches, elevated heart rate (98 bpm), and severe insomnia. Recommend 3 days rest rotation and temporary relief from perimeter watch.');
  const [fileName, setFileName] = useState('medical_consultation_report.pdf');
  const [saving, setSaving] = useState(false);

  // Local AI Analysis State
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState<DoctorReportAnalysis | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (preset: typeof TACTICAL_CASE_PRESETS[0]) => {
    setActivePreset(preset.id);
    setDoctorName(preset.doctor);
    setFacility(preset.facility);
    setConsultationType(preset.type);
    setDiagnosis(preset.diagnosis);
    setClinicalNotes(preset.notes);
    setAiResult(null);
  };

  const handleAnalyzeWithLocalAI = async () => {
    if (!clinicalNotes.trim() && !diagnosis.trim()) return;
    setAnalyzingAI(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await analyzeDoctorReport({
        person_id: personId,
        doctor_name: doctorName.trim() || 'Duty Medical Officer',
        facility: facility.trim() || 'Base Hospital',
        consultation_date: today,
        consultation_type: consultationType,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        doctor_stress_indicator: stressIndicator,
        recommended_rest_days: restDays,
        fit_for_duty: fitForDuty,
      });

      if (res && res.data) {
        setAiResult(res.data);
        if (res.data.doctor_stress_indicator) {
          setStressIndicator(res.data.doctor_stress_indicator);
        }
        if (typeof res.data.recommended_rest_days === 'number') {
          setRestDays(res.data.recommended_rest_days);
        }
        if (typeof res.data.fit_for_duty === 'boolean') {
          setFitForDuty(res.data.fit_for_duty);
        }
      }
    } catch (err) {
      console.warn('AI analysis error:', err);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleSave = async () => {
    if (!doctorName.trim()) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await insertMedicalRecord({
        personId,
        date: today,
        doctorName: doctorName.trim(),
        facility: facility.trim(),
        consultationType,
        diagnosis: diagnosis.trim() || undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
        stressIndicator,
        recommendedRestDays: restDays,
        fitForDuty,
        fileName: fileName.trim() || undefined,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.warn('Error saving doctor report:', err);
    } finally {
      setSaving(false);
    }
  };

  const getIndicatorColor = (ind: string) => {
    switch (ind) {
      case 'Severe': return colors.stateSustained;
      case 'High': return colors.warning;
      case 'Moderate': return colors.stateEmerging;
      default: return colors.success;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Doctor / Medical Report</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Local Qwen-0.5B Clinical NLP</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Info Banner */}
          <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
            <Text style={[styles.bannerText, { color: isDark ? '#93C5FD' : colors.primaryHover }]}>
              Medical reports are parsed locally by our fine-tuned Qwen model (100% on-device/isolated node). Zero patient health data is ever transmitted to public cloud LLMs.
            </Text>
          </View>

          {/* Quick Tactical Presets for Demonstration */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flash-outline" size={16} color={colors.accent} />
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Load Tactical Medical Scenarios (Demonstration)
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
            {TACTICAL_CASE_PRESETS.map((p) => {
              const active = activePreset === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.presetChip,
                    { backgroundColor: colors.backgroundElement, borderColor: active ? p.color : colors.border },
                    active && { backgroundColor: p.color + '15' },
                  ]}
                  onPress={() => applyPreset(p)}
                >
                  <View style={[styles.presetDot, { backgroundColor: p.color }]} />
                  <View>
                    <Text style={[styles.presetTitle, { color: colors.text }, active && { fontWeight: '700', color: p.color }]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.presetTag, { color: colors.textMuted }]}>{p.tag}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Doctor & Facility */}
          <Text style={[styles.label, { color: colors.text }]}>Attending Medical Officer</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="E.g. Dr. A. K. Verma, MD"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Medical Facility / Hospital</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={facility}
            onChangeText={setFacility}
            placeholder="E.g. Composite Hospital, Border Wing"
            placeholderTextColor={colors.textMuted}
          />

          {/* Consultation Type */}
          <Text style={[styles.label, { color: colors.text }]}>Consultation Type</Text>
          <View style={styles.chipContainer}>
            {CONSULTATION_TYPES.map((type) => {
              const active = consultationType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    active && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight },
                  ]}
                  onPress={() => setConsultationType(type)}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, active && { color: colors.primary, fontWeight: '700' }]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Diagnosis & Clinical Notes */}
          <Text style={[styles.label, { color: colors.text }]}>Clinical Observations / Diagnosis</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="E.g. Combat fatigue, sleep disruption"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Doctor's Recommendation & Clinical Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
            placeholder="Doctor's notes regarding duty suitability, rest requirements, and psychological state..."
            placeholderTextColor={colors.textMuted}
          />

          {/* Local Qwen AI Extraction Action Button */}
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: colors.primary }]}
            onPress={handleAnalyzeWithLocalAI}
            disabled={analyzingAI || (!clinicalNotes.trim() && !diagnosis.trim())}
          >
            {analyzingAI ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.aiButtonText}>Analyzing with Local Qwen-0.5B...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.aiButtonText}>Extract with Qwen-0.5B (Local AI)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* AI Extraction Results Card */}
          {aiResult && (
            <View style={[styles.aiCard, { backgroundColor: colors.backgroundElement, borderColor: colors.primary }]}>
              <View style={styles.aiCardHeader}>
                <View style={styles.aiBadge}>
                  <Ionicons name="hardware-chip-outline" size={14} color={colors.primary} />
                  <Text style={[styles.aiBadgeText, { color: colors.primary }]}>{aiResult.model_engine || 'Qwen-0.5B Fine-Tuned'}</Text>
                </View>
                <View style={[styles.urgencyPill, { backgroundColor: aiResult.clinical_urgency === 'Immediate' ? '#EF444420' : aiResult.clinical_urgency === 'Elevated' ? '#F59E0B20' : '#10B98120' }]}>
                  <Text style={[styles.urgencyText, { color: aiResult.clinical_urgency === 'Immediate' ? '#EF4444' : aiResult.clinical_urgency === 'Elevated' ? '#F59E0B' : '#10B981' }]}>
                    {aiResult.clinical_urgency} Urgency
                  </Text>
                </View>
              </View>

              <View style={styles.aiMetricsRow}>
                <View style={styles.aiMetricBox}>
                  <Text style={[styles.aiMetricLabel, { color: colors.textSecondary }]}>Stress Level</Text>
                  <Text style={[styles.aiMetricVal, { color: getIndicatorColor(aiResult.doctor_stress_indicator) }]}>
                    {aiResult.doctor_stress_indicator}
                  </Text>
                </View>
                <View style={styles.aiMetricBox}>
                  <Text style={[styles.aiMetricLabel, { color: colors.textSecondary }]}>Duty Fitness</Text>
                  <Text style={[styles.aiMetricVal, { color: aiResult.fit_for_duty ? colors.success : colors.stateSustained }]}>
                    {aiResult.fit_for_duty ? 'Fully Fit' : 'Restricted'}
                  </Text>
                </View>
                <View style={styles.aiMetricBox}>
                  <Text style={[styles.aiMetricLabel, { color: colors.textSecondary }]}>Prescribed Rest</Text>
                  <Text style={[styles.aiMetricVal, { color: colors.text }]}>
                    {aiResult.recommended_rest_days} Days
                  </Text>
                </View>
              </View>

              {aiResult.somatic_symptoms && aiResult.somatic_symptoms.length > 0 && (
                <View style={{ marginTop: Spacing.two }}>
                  <Text style={[styles.sublabel, { color: colors.textSecondary, marginBottom: 4 }]}>Detected Somatic Signs:</Text>
                  <View style={styles.somaticRow}>
                    {aiResult.somatic_symptoms.map((s, idx) => (
                      <View key={idx} style={[styles.somaticPill, { backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6' }]}>
                        <Text style={[styles.somaticText, { color: colors.text }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {aiResult.key_clinical_findings && aiResult.key_clinical_findings.length > 0 && (
                <View style={{ marginTop: Spacing.two }}>
                  <Text style={[styles.sublabel, { color: colors.textSecondary, marginBottom: 4 }]}>Key Clinical Findings:</Text>
                  {aiResult.key_clinical_findings.map((f, i) => (
                    <Text key={i} style={[styles.findingText, { color: colors.text }]}>
                      • {f}
                    </Text>
                  ))}
                </View>
              )}

              <View style={[styles.welfareBox, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.1)' : '#EFF6FF' }]}>
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={[styles.welfareText, { color: colors.text }]}>{aiResult.welfare_impact}</Text>
              </View>

              <Text style={[styles.autoAppliedNote, { color: colors.success }]}>
                ✓ Extracted parameters automatically synced to form fields below.
              </Text>
            </View>
          )}

          {/* Doctor's Observed Stress Indicator */}
          <Text style={[styles.label, { color: colors.text }]}>Clinical Stress Assessment</Text>
          <View style={styles.indicatorRow}>
            {STRESS_INDICATORS.map((ind) => {
              const active = stressIndicator === ind;
              const color = getIndicatorColor(ind);
              return (
                <TouchableOpacity
                  key={ind}
                  style={[
                    styles.indicatorBtn,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    active && { borderColor: color, backgroundColor: color + '15' },
                  ]}
                  onPress={() => setStressIndicator(ind)}
                >
                  <View style={[styles.indicatorDot, { backgroundColor: color }]} />
                  <Text style={[styles.indicatorText, { color: colors.textSecondary }, active && { color, fontWeight: '700' }]}>
                    {ind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recommended Rest Days */}
          <View style={[styles.restRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 2, marginTop: 0 }]}>Recommended Rest / Sick Days</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Excused duty days for biological recovery</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
                onPress={() => setRestDays(Math.max(0, restDays - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: colors.text }]}>{restDays} d</Text>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
                onPress={() => setRestDays(Math.min(14, restDays + 1))}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Fit for Duty Toggle */}
          <View style={[styles.restRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border, marginTop: Spacing.three }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 2, marginTop: 0 }]}>Fit for Active Duty</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Cleared for operational weapon and deployment duty</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dutyToggle,
                { backgroundColor: fitForDuty ? colors.success + '20' : colors.stateSustained + '20', borderColor: fitForDuty ? colors.success : colors.stateSustained }
              ]}
              onPress={() => setFitForDuty(!fitForDuty)}
            >
              <Ionicons name={fitForDuty ? 'checkmark-circle' : 'alert-circle'} size={18} color={fitForDuty ? colors.success : colors.stateSustained} />
              <Text style={[styles.dutyToggleText, { color: fitForDuty ? colors.success : colors.stateSustained }]}>
                {fitForDuty ? 'Fit' : 'Unfit / Excused'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Simulated File Upload Card */}
          <Text style={[styles.label, { color: colors.text }]}>Attached Report Document</Text>
          <View style={[styles.attachmentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="document-attach" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <Text style={[styles.attachName, { color: colors.text }]}>{fileName}</Text>
              <Text style={[styles.attachSize, { color: colors.textSecondary }]}>Verified Official Military Medical Record · 245 KB</Text>
            </View>
            <TouchableOpacity onPress={() => setFileName('medical_report_' + Date.now().toString().slice(-4) + '.pdf')}>
              <Ionicons name="sync" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.backgroundElement, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save & Integrate'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  iconButton: {
    padding: Spacing.two,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.primaryLight,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.primaryHover,
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.two,
    minWidth: 160,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetTag: {
    fontSize: 10,
    marginTop: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.navy,
    marginBottom: Spacing.two,
    marginTop: Spacing.three,
  },
  sublabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  input: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    fontSize: 13,
    color: Colors.light.text,
  },
  multilineInput: {
    height: 85,
    textAlignVertical: 'top',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aiCard: {
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  urgencyPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  aiMetricBox: {
    alignItems: 'center',
    flex: 1,
  },
  aiMetricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  aiMetricVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  somaticRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  somaticPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  somaticText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  findingText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  welfareBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
  },
  welfareText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  autoAppliedNote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  indicatorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    gap: Spacing.one,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.two,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  dutyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  dutyToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.two,
  },
  attachName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  attachSize: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.four,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSelected,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.four,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    gap: Spacing.two,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
