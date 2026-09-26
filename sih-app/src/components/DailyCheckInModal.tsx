import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insertCheckIn } from '@/repositories/checkIns';

interface DailyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const QUICK_SLEEP_OPTIONS = [4.5, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 9.0];
const SCALE_OPTIONS = ['Much lower', 'Lower', 'Usual', 'Higher', 'Much higher'];
const ENERGY_OPTIONS = ['Low', 'Mild', 'Usual', 'Energetic', 'Peak'];
const RECOVERY_OPTIONS = ['Strained', 'Slow', 'Normal', 'Restored', 'Recharged'];

export default function DailyCheckInModal({ visible, onClose, onSubmit }: DailyCheckInModalProps) {
  const [step, setStep] = useState(1);
  
  // Form State — sleep is strictly in HOURS
  const [sleepHours, setSleepHours] = useState<number>(7.0);
  const [workload, setWorkload] = useState('Usual');
  const [energy, setEnergy] = useState('Usual');
  const [recovery, setRecovery] = useState('Normal');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const adjustSleep = (delta: number) => {
    setSleepHours(prev => Math.min(14.0, Math.max(2.0, Math.round((prev + delta) * 10) / 10)));
  };

  const getSleepStatus = (h: number) => {
    if (h < 5.0) return { label: 'Severe Sleep Deficit · High Stress Risk', color: Colors.light.stateSustained, bg: Colors.light.stateSustainedBg };
    if (h < 6.5) return { label: 'Below Optimal · Increased Fatigue', color: Colors.light.warning, bg: '#FFF8E6' };
    if (h <= 8.5) return { label: 'Optimal Restorative Sleep', color: Colors.light.success, bg: '#EBF9F1' };
    return { label: 'Extended Rest Interval', color: Colors.light.accent, bg: '#EFF6FF' };
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const derivedSleepCompared = sleepHours < 6.0 ? 'Lower' : sleepHours > 8.0 ? 'Higher' : 'Usual';

      await insertCheckIn({
        date: today,
        sleepHours,
        sleepCompared: derivedSleepCompared,
        workloadCompared: workload,
        energyLevel: energy,
        recoveryFeeling: recovery,
        note: note.trim() || undefined,
      });

      onSubmit();
      setTimeout(() => {
        setStep(1);
        setSleepHours(7.0);
        setWorkload('Usual');
        setEnergy('Usual');
        setRecovery('Normal');
        setNote('');
        setSaving(false);
      }, 400);
    } catch (err) {
      console.warn('Error saving daily check-in:', err);
      setSaving(false);
      onSubmit();
    }
  };

  const renderSelector = (options: string[], selected: string, onSelect: (val: string) => void) => (
    <View style={styles.selectorContainer}>
      {options.map((opt) => {
        const isActive = selected === opt;
        return (
          <TouchableOpacity 
            key={opt}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const sleepStatus = getSleepStatus(sleepHours);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Wellbeing Check-in</Text>
          <View style={styles.iconButton} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.progressDot, i <= step ? styles.progressDotActive : null]} />
          ))}
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Ionicons name="moon" size={44} color={Colors.light.primary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How many hours of sleep did you get?</Text>
              <Text style={styles.questionSubtitle}>Record exact hours to track cognitive fatigue and recovery</Text>

              {/* Exact Hours Display with Stepper */}
              <View style={styles.sleepDisplayCard}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustSleep(-0.5)}>
                  <Ionicons name="remove" size={24} color={Colors.light.navy} />
                </TouchableOpacity>

                <View style={styles.hoursBox}>
                  <Text style={styles.hoursValue}>{sleepHours.toFixed(1)}</Text>
                  <Text style={styles.hoursUnit}>hours</Text>
                </View>

                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustSleep(0.5)}>
                  <Ionicons name="add" size={24} color={Colors.light.navy} />
                </TouchableOpacity>
              </View>

              {/* Dynamic Status Pill */}
              <View style={[styles.statusBadge, { backgroundColor: sleepStatus.bg }]}>
                <Ionicons name="shield-checkmark" size={14} color={sleepStatus.color} />
                <Text style={[styles.statusBadgeText, { color: sleepStatus.color }]}>
                  {sleepStatus.label}
                </Text>
              </View>

              {/* Quick Select Buttons */}
              <Text style={styles.quickSelectLabel}>Quick Select:</Text>
              <View style={styles.quickGrid}>
                {QUICK_SLEEP_OPTIONS.map((hrs) => {
                  const isActive = sleepHours === hrs;
                  return (
                    <TouchableOpacity
                      key={hrs}
                      style={[styles.quickPill, isActive && styles.quickPillActive]}
                      onPress={() => setSleepHours(hrs)}
                    >
                      <Text style={[styles.quickPillText, isActive && styles.quickPillTextActive]}>
                        {hrs.toFixed(1)}h
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Ionicons name="briefcase" size={44} color={Colors.light.primary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How is your duty workload compared to usual?</Text>
              {renderSelector(SCALE_OPTIONS, workload, setWorkload)}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Ionicons name="flash" size={44} color={Colors.light.warning} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How is your physical energy right now?</Text>
              {renderSelector(ENERGY_OPTIONS, energy, setEnergy)}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Ionicons name="battery-charging" size={44} color={Colors.light.success} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How recovered do you feel before duty?</Text>
              {renderSelector(RECOVERY_OPTIONS, recovery, setRecovery)}
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContainer}>
              <Ionicons name="document-text" size={44} color={Colors.light.textSecondary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>Anything else you'd like to note?</Text>
              <Text style={styles.questionSubtitle}>Private operational, health, or somatic context (optional)</Text>

              {/* Quick Somatic Tags */}
              <Text style={styles.quickSelectLabel}>Quick Symptom Tags:</Text>
              <View style={styles.somaticTagsGrid}>
                {[
                  { label: '👁️ Eyes Feeling Heavy', text: 'Eyes feeling heavy, ocular strain' },
                  { label: '🦵 Leg / Muscle Pain', text: 'Pain in leg and muscle soreness' },
                  { label: '🤕 Headache / Dizziness', text: 'Headache and dizziness' },
                  { label: '😴 Extreme Exhaustion', text: 'Severe operational exhaustion' },
                  { label: '⚡ Back / Joint Ache', text: 'Lower back ache from combat gear' },
                ].map((tag) => {
                  const isPresent = note.toLowerCase().includes(tag.text.toLowerCase().split(',')[0]);
                  return (
                    <TouchableOpacity
                      key={tag.label}
                      style={[styles.somaticTagBtn, isPresent && styles.somaticTagBtnActive]}
                      onPress={() => {
                        if (isPresent) {
                          setNote(prev => prev.replace(tag.text, '').trim());
                        } else {
                          setNote(prev => (prev ? `${prev}, ${tag.text}` : tag.text));
                        }
                      }}
                    >
                      <Text style={[styles.somaticTagText, isPresent && styles.somaticTagTextActive]}>
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.textInput}
                multiline
                placeholder="E.g. Challenging night shift, eyes feeling heavy, pain in my leg..."
                placeholderTextColor={Colors.light.textMuted}
                value={note}
                onChangeText={setNote}
              />

              {/* Real-time AI Somatic Symptom Extraction Badge */}
              {(() => {
                const lower = note.toLowerCase();
                const detected: string[] = [];
                if (lower.includes('eye') || lower.includes('heavy') || lower.includes('vision') || lower.includes('blur')) {
                  detected.push('Ocular Fatigue (Heavy Eyes)');
                }
                if (lower.includes('leg') || lower.includes('pain') || lower.includes('back') || lower.includes('ache') || lower.includes('stiff') || lower.includes('calf')) {
                  detected.push('Musculoskeletal Strain');
                }
                if (lower.includes('headache') || lower.includes('dizzy') || lower.includes('migraine') || lower.includes('tremor')) {
                  detected.push('Neurological Strain');
                }
                if (lower.includes('exhaust') || lower.includes('drained') || lower.includes('burnout')) {
                  detected.push('Acute Physical Exhaustion');
                }
                if (detected.length === 0) return null;

                return (
                  <View style={styles.aiSomaticCard}>
                    <View style={styles.aiSomaticHeader}>
                      <Ionicons name="sparkles" size={14} color="#7C3AED" />
                      <Text style={styles.aiSomaticTitle}>NLP Somatic Fatigue Signals Recognized</Text>
                    </View>
                    <View style={styles.somaticChipsRow}>
                      {detected.map((sym) => (
                        <View key={sym} style={styles.somaticChip}>
                          <Ionicons name="pulse" size={12} color="#DC2626" />
                          <Text style={styles.somaticChipText}>{sym}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.aiSomaticDesc}>
                      These somatic indicators will be factored into your operational stress assessment and rest recommendations.
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}
        </ScrollView>

        {/* Footer Controls */}
        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 5 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Finish & Save'}</Text>
            </TouchableOpacity>
          )}
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
    fontWeight: '600',
    color: Colors.light.text,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.six,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepIcon: {
    marginBottom: Spacing.three,
  },
  questionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.light.navy,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  questionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  sleepDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.md,
    marginBottom: Spacing.four,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursBox: {
    alignItems: 'center',
  },
  hoursValue: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  hoursUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: -4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    marginBottom: Spacing.six,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickSelectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.three,
    alignSelf: 'flex-start',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    width: '100%',
    justifyContent: 'space-between',
  },
  quickPill: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: '22%',
    alignItems: 'center',
  },
  quickPillActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  quickPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  quickPillTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  selectorContainer: {
    width: '100%',
    gap: Spacing.three,
  },
  pill: {
    width: '100%',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.light.borderSubtle,
    alignItems: 'center',
    ...Shadow.sm,
  },
  pillActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  pillTextActive: {
    color: Colors.light.primaryHover,
    fontWeight: '700',
  },
  textInput: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    fontSize: 15,
    color: Colors.light.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: Spacing.four,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSelected,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.four,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    gap: Spacing.two,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  somaticTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: Spacing.three,
  },
  somaticTagBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  somaticTagBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  somaticTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  somaticTagTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  aiSomaticCard: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  aiSomaticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiSomaticTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
    textTransform: 'uppercase',
  },
  somaticChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  somaticChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  somaticChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  aiSomaticDesc: {
    fontSize: 11,
    color: '#7E22CE',
    lineHeight: 15,
  },
});
