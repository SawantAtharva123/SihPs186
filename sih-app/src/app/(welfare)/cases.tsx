import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CasesScreen() {
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const mockCases = [
    { id: 'C-084', name: 'Rohan Verma', status: 'Intervention Planned', priority: 'High', date: 'Oct 12', reason: 'Cumulative Sleep Debt' },
    { id: 'C-082', name: 'Amit Singh', status: 'Under Review', priority: 'Routine', date: 'Oct 10', reason: 'Schedule Volatility' },
    { id: 'C-078', name: 'Priya Sharma', status: 'New', priority: 'Routine', date: 'Oct 09', reason: 'Conflicting Signals' },
    { id: 'C-071', name: 'Vikram Das', status: 'Follow-up', priority: 'Routine', date: 'Oct 05', reason: 'Recovery Decline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welfare Cases</Text>
      </View>

      <ScrollView style={styles.list}>
        {mockCases.map(c => (
          <TouchableOpacity key={c.id} style={styles.card} onPress={() => setSelectedCase(c)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{c.name}</Text>
              <Text style={styles.cardId}>{c.id}</Text>
            </View>
            <Text style={styles.cardReason}>{c.reason}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.badge}><Text style={styles.badgeText}>{c.status}</Text></View>
              <Text style={styles.cardDate}>{c.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Case Detail Modal */}
      <Modal visible={!!selectedCase} animationType="slide" onRequestClose={() => setSelectedCase(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedCase(null)}><Ionicons name="close" size={24} color={Colors.light.text} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Case {selectedCase?.id}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedCase && (
              <>
                <Text style={styles.detailName}>{selectedCase.name}</Text>
                
                <View style={styles.stepper}>
                  <Text style={styles.stepperTitle}>Current Stage: {selectedCase.status}</Text>
                  <View style={styles.stepRow}>
                    <View style={styles.stepDotActive} />
                    <View style={styles.stepLineActive} />
                    <View style={styles.stepDotActive} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.stepLabel}>Review</Text>
                    <Text style={styles.stepLabel}>Intervention</Text>
                    <Text style={styles.stepLabel}>Close</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Observed Pattern</Text>
                  <Text style={styles.textBody}>Personnel shows consecutive short sleep periods (&lt; 5h) combined with high subjective workload over the last 14 days.</Text>
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Possible Contributors</Text>
                  <Text style={styles.textBody}>• Night shift rotation (3 consecutive) {'\n'}• Commute delay reported on check-in</Text>
                </View>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Navigating to intervention planner')}>
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
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  list: { padding: Spacing.four },
  card: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  cardName: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  cardId: { fontSize: 13, color: Colors.light.textSecondary },
  cardReason: { fontSize: 14, color: Colors.light.text, marginBottom: Spacing.three },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: Colors.light.backgroundSelected, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.light.navy },
  cardDate: { fontSize: 12, color: Colors.light.textMuted },
  
  modalContainer: { flex: 1, backgroundColor: Colors.light.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  modalContent: { padding: Spacing.six },
  detailName: { fontSize: 28, fontWeight: 'bold', color: Colors.light.navy, marginBottom: Spacing.six },
  
  stepper: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, borderWidth: 1, borderColor: Colors.light.border },
  stepperTitle: { fontWeight: 'bold', marginBottom: Spacing.four },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
  stepDotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.primary },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.border },
  stepLineActive: { flex: 1, height: 2, backgroundColor: Colors.light.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.light.border },
  stepLabel: { fontSize: 11, color: Colors.light.textSecondary },
  
  section: { marginBottom: Spacing.six },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.two },
  textBody: { fontSize: 15, color: Colors.light.textSecondary, lineHeight: 22 },
  
  actionBtn: { flexDirection: 'row', backgroundColor: Colors.light.primary, padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.four },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
