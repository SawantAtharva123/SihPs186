import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export default function CasesScreen() {
  const { colors, isDark } = useTheme();
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const mockCases = [
    { id: 'C-084', name: 'Rohan Verma', status: 'Intervention Planned', priority: 'High', date: 'Oct 12', reason: 'Cumulative Sleep Debt' },
    { id: 'C-082', name: 'Amit Singh', status: 'Under Review', priority: 'Routine', date: 'Oct 10', reason: 'Schedule Volatility' },
    { id: 'C-078', name: 'Priya Sharma', status: 'New', priority: 'Routine', date: 'Oct 09', reason: 'Conflicting Signals' },
    { id: 'C-071', name: 'Vikram Das', status: 'Follow-up', priority: 'Routine', date: 'Oct 05', reason: 'Recovery Decline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>Welfare Cases</Text>
      </View>

      <ScrollView style={styles.list}>
        {mockCases.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedCase(c)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: colors.text }]}>{c.name}</Text>
              <Text style={[styles.cardId, { color: colors.textSecondary }]}>{c.id}</Text>
            </View>
            <Text style={[styles.cardReason, { color: colors.textSecondary }]}>{c.reason}</Text>
            <View style={styles.cardFooter}>
              <View style={[styles.badge, { backgroundColor: isDark ? colors.backgroundSelected : Colors.light.backgroundSelected }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{c.status}</Text>
              </View>
              <Text style={[styles.cardDate, { color: colors.textMuted }]}>{c.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Case Detail Modal */}
      <Modal visible={!!selectedCase} animationType="slide" onRequestClose={() => setSelectedCase(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <TouchableOpacity onPress={() => setSelectedCase(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Case {selectedCase?.id}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedCase && (
              <>
                <Text style={[styles.detailName, { color: isDark ? '#F8FAFC' : colors.navy }]}>{selectedCase.name}</Text>
                
                <View style={[styles.stepper, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.stepperTitle, { color: colors.text }]}>Current Stage: {selectedCase.status}</Text>
                  <View style={styles.stepRow}>
                    <View style={[styles.stepDotActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepLineActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepDotActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Review</Text>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Intervention</Text>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Close</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Observed Pattern</Text>
                  <Text style={[styles.textBody, { color: colors.textSecondary }]}>Personnel shows consecutive short sleep periods (&lt; 5h) combined with high subjective workload over the last 14 days.</Text>
                </View>
                
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Possible Contributors</Text>
                  <Text style={[styles.textBody, { color: colors.textSecondary }]}>• Night shift rotation (3 consecutive) {'\n'}• Commute delay reported on check-in</Text>
                </View>
                
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => alert('Navigating to intervention planner')}>
                  <Ionicons name="flask" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Plan Intervention</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.four, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: Spacing.four },
  card: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardId: { fontSize: 13 },
  cardReason: { fontSize: 14, marginBottom: Spacing.three },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardDate: { fontSize: 12 },
  
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { padding: Spacing.six },
  detailName: { fontSize: 28, fontWeight: 'bold', marginBottom: Spacing.six },
  
  stepper: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, borderWidth: 1 },
  stepperTitle: { fontWeight: 'bold', marginBottom: Spacing.four },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
  stepDotActive: { width: 12, height: 12, borderRadius: 6 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLineActive: { flex: 1, height: 2 },
  stepLine: { flex: 1, height: 2 },
  stepLabel: { fontSize: 11 },
  
  section: { marginBottom: Spacing.six },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Spacing.two },
  textBody: { fontSize: 15, lineHeight: 22 },
  
  actionBtn: { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.four },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
