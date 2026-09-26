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
      case 'Severe': return Colors.light.stateSustained;
      case 'High': return Colors.light.warning;
      case 'Moderate': return Colors.light.stateEmerging;
      default: return Colors.light.success;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Doctor / Medical Report</Text>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Info Banner */}
          <View style={styles.banner}>
            <Ionicons name="medical" size={22} color={Colors.light.primary} />
            <Text style={styles.bannerText}>
              Medical reports are integrated into the multi-modal AI stress assessment to safeguard personnel welfare and prevent undercounting strain.
            </Text>
          </View>

          {/* Doctor & Facility */}
          <Text style={styles.label}>Attending Medical Officer</Text>
          <TextInput
            style={styles.input}
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="E.g. Dr. A. K. Verma, MD"
            placeholderTextColor={Colors.light.textMuted}
          />

          <Text style={styles.label}>Medical Facility / Hospital</Text>
          <TextInput
            style={styles.input}
            value={facility}
            onChangeText={setFacility}
            placeholder="E.g. Composite Hospital, Border Wing"
            placeholderTextColor={Colors.light.textMuted}
          />

          {/* Consultation Type */}
          <Text style={styles.label}>Consultation Type</Text>
          <View style={styles.chipContainer}>
            {CONSULTATION_TYPES.map((type) => {
              const active = consultationType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setConsultationType(type)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Doctor's Observed Stress Indicator */}
          <Text style={styles.label}>Clinical Stress Assessment</Text>
          <View style={styles.indicatorRow}>
            {STRESS_INDICATORS.map((ind) => {
              const active = stressIndicator === ind;
              const color = getIndicatorColor(ind);
              return (
                <TouchableOpacity
                  key={ind}
                  style={[
                    styles.indicatorBtn,
                    active && { borderColor: color, backgroundColor: color + '15' },
                  ]}
                  onPress={() => setStressIndicator(ind)}
                >
                  <View style={[styles.indicatorDot, { backgroundColor: color }]} />
                  <Text style={[styles.indicatorText, active && { color, fontWeight: '700' }]}>
                    {ind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recommended Rest Days */}
          <View style={styles.restRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Recommended Rest / Sick Days</Text>
              <Text style={styles.sublabel}>Excused duty days for biological recovery</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setRestDays(Math.max(0, restDays - 1))}
              >
                <Ionicons name="remove" size={18} color={Colors.light.navy} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{restDays} d</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setRestDays(Math.min(14, restDays + 1))}
              >
                <Ionicons name="add" size={18} color={Colors.light.navy} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Diagnosis & Clinical Notes */}
          <Text style={styles.label}>Clinical Observations / Diagnosis</Text>
          <TextInput
            style={styles.input}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="E.g. Combat fatigue, sleep disruption"
            placeholderTextColor={Colors.light.textMuted}
          />

          <Text style={styles.label}>Doctor's Recommendation & Welfare Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
            placeholder="Doctor's notes regarding duty suitability, rest requirements, and psychological state..."
            placeholderTextColor={Colors.light.textMuted}
          />

          {/* Simulated File Upload Card */}
          <Text style={styles.label}>Attached Report Document</Text>
          <View style={styles.attachmentCard}>
            <Ionicons name="document-attach" size={24} color={Colors.light.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <Text style={styles.attachName}>{fileName}</Text>
              <Text style={styles.attachSize}>Verified Official Medical Record · 245 KB</Text>
            </View>
            <TouchableOpacity onPress={() => setFileName('medical_report_' + Date.now().toString().slice(-4) + '.pdf')}>
              <Ionicons name="sync" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
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
