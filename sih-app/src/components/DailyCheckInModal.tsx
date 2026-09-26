import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DailyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const SCALE_OPTIONS = ['Much lower', 'Lower', 'Usual', 'Higher', 'Much higher'];
const ENERGY_OPTIONS = ['Low', 'Mild', 'Usual', 'Energetic', 'Peak'];
const RECOVERY_OPTIONS = ['Strained', 'Slow', 'Normal', 'Restored', 'Recharged'];

export default function DailyCheckInModal({ visible, onClose, onSubmit }: DailyCheckInModalProps) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [sleep, setSleep] = useState('Usual');
  const [workload, setWorkload] = useState('Usual');
  const [energy, setEnergy] = useState('Usual');
  const [recovery, setRecovery] = useState('Normal');
  const [note, setNote] = useState('');

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Here we would normally save to SQLite / Context
    onSubmit();
    // Reset form
    setTimeout(() => {
      setStep(1);
      setSleep('Usual');
      setWorkload('Usual');
      setEnergy('Usual');
      setRecovery('Normal');
      setNote('');
    }, 500);
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-in</Text>
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
              <Ionicons name="moon" size={48} color={Colors.light.primary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How was your sleep compared to usual?</Text>
              {renderSelector(SCALE_OPTIONS, sleep, setSleep)}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Ionicons name="briefcase" size={48} color={Colors.light.primary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How is your workload compared to usual?</Text>
              {renderSelector(SCALE_OPTIONS, workload, setWorkload)}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Ionicons name="flash" size={48} color={Colors.light.warning} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How is your energy level right now?</Text>
              {renderSelector(ENERGY_OPTIONS, energy, setEnergy)}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Ionicons name="battery-charging" size={48} color={Colors.light.success} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>How recovered do you feel?</Text>
              {renderSelector(RECOVERY_OPTIONS, recovery, setRecovery)}
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContainer}>
              <Ionicons name="document-text" size={48} color={Colors.light.textSecondary} style={styles.stepIcon} />
              <Text style={styles.questionTitle}>Anything else you'd like to note? (Optional)</Text>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Add a note..."
                placeholderTextColor={Colors.light.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>
          )}
        </ScrollView>

        {/* Footer Controls */}
        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 5 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.light.backgroundElement} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.light.backgroundElement} />
              <Text style={styles.primaryButtonText}>Finish & Save</Text>
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
  },
  stepIcon: {
    marginBottom: Spacing.four,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.eight,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.backgroundElement,
  },
});

