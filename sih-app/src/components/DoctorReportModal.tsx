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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insertMedicalRecord } from '@/repositories/medical';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';

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

export default function DoctorReportModal({ visible, onClose, onSaved }: DoctorReportModalProps) {
  const { currentUser } = useSahayak();
  const { colors, isDark } = useTheme();
  const personId = currentUser?.id ?? 'person-001';

  const [doctorName, setDoctorName] = useState('Dr. S. Nair, MD');
  const [facility, setFacility] = useState('Base Hospital Wellness Unit');
  const [consultationType, setConsultationType] = useState('Operational Stress & Fatigue');
  const [stressIndicator, setStressIndicator] = useState<'Normal' | 'Moderate' | 'High' | 'Severe'>('High');
  const [restDays, setRestDays] = useState(2);
  const [fitForDuty, setFitForDuty] = useState(true);
  const [diagnosis, setDiagnosis] = useState('Operational fatigue & disrupted circadian pattern');
  const [clinicalNotes, setClinicalNotes] = useState('Advised recovery sleep interval and 48h rest rotation before weapon duty.');
  const [fileName, setFileName] = useState('medical_consultation_report.pdf');
  const [saving, setSaving] = useState(false);

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Doctor / Medical Report</Text>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Info Banner */}
          <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
            <Ionicons name="medical" size={22} color={colors.primary} />
            <Text style={[styles.bannerText, { color: isDark ? '#93C5FD' : colors.primaryHover }]}>
              Medical reports are integrated into the multi-modal AI stress assessment to safeguard personnel welfare and prevent undercounting strain.
            </Text>
          </View>

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
              <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]}>Recommended Rest / Sick Days</Text>
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

          {/* Diagnosis & Clinical Notes */}
          <Text style={[styles.label, { color: colors.text }]}>Clinical Observations / Diagnosis</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="E.g. Combat fatigue, sleep disruption"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Doctor's Recommendation & Welfare Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
            placeholder="Doctor's notes regarding duty suitability, rest requirements, and psychological state..."
            placeholderTextColor={colors.textMuted}
          />

          {/* Simulated File Upload Card */}
          <Text style={[styles.label, { color: colors.text }]}>Attached Report Document</Text>
          <View style={[styles.attachmentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="document-attach" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <Text style={[styles.attachName, { color: colors.text }]}>{fileName}</Text>
              <Text style={[styles.attachSize, { color: colors.textSecondary }]}>Verified Official Medical Record · 245 KB</Text>
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
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save & Analyze'}</Text>
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
    marginBottom: Spacing.five,
    gap: Spacing.three,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.primaryHover,
    lineHeight: 18,
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
    fontSize: 14,
    color: Colors.light.text,
  },
  multilineInput: {
    height: 85,
    textAlignVertical: 'top',
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
  chipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
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
