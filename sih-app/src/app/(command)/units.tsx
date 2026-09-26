import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommandUnitsScreen() {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const mockUnits = [
    { id: 'u1', name: 'Unit 402', headcount: 124, state: 'Stable', stateColor: Colors.light.stateStable, weatherIcon: 'sunny' },
    { id: 'u2', name: 'North Zone', headcount: 312, state: 'Emerging Change', stateColor: Colors.light.stateEmerging, weatherIcon: 'partly-sunny' },
    { id: 'u3', name: 'Training Wing', headcount: 85, state: 'Persistent Deviation', stateColor: Colors.light.statePersistent, weatherIcon: 'rainy' },
    { id: 'u4', name: 'Deployment Unit', headcount: 450, state: 'Sustained Concern', stateColor: Colors.light.stateSustained, weatherIcon: 'thunderstorm' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unit Readiness</Text>
      </View>

      <ScrollView style={styles.list}>
        {mockUnits.map(u => (
          <TouchableOpacity key={u.id} style={styles.card} onPress={() => setSelectedUnit(u)}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield" size={24} color={Colors.light.primary} />
                <Text style={styles.cardTitle}>{u.name}</Text>
              </View>
              <Ionicons name={u.weatherIcon as any} size={28} color={u.stateColor} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Headcount</Text>
                <Text style={styles.statValue}>{u.headcount}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>State</Text>
                <Text style={[styles.statValue, { color: u.stateColor }]}>{u.state}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal visible={!!selectedUnit} animationType="slide" onRequestClose={() => setSelectedUnit(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedUnit(null)}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedUnit?.name} Detail</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedUnit && (
              <>
                <View style={styles.detailHero}>
                  <Ionicons name={selectedUnit.weatherIcon as any} size={64} color={selectedUnit.stateColor} />
                  <Text style={styles.detailName}>{selectedUnit.name}</Text>
                  <Text style={[styles.detailState, { color: selectedUnit.stateColor }]}>{selectedUnit.state}</Text>
                </View>

                {/* Trend Analysis */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Trend Analysis (Last 30 Days)</Text>
                  <View style={styles.trendGrid}>
                    <View style={styles.trendBox}>
                      <Text style={styles.trendLabel}>Recovery</Text>
                      <Text style={styles.trendValue}>-12%</Text>
                      <Ionicons name="trending-down" size={20} color={Colors.light.stateSustained} />
                    </View>
                    <View style={styles.trendBox}>
                      <Text style={styles.trendLabel}>Workload</Text>
                      <Text style={styles.trendValue}>+24%</Text>
                      <Ionicons name="trending-up" size={20} color={Colors.light.stateSustained} />
                    </View>
                  </View>
                </View>

                {/* Root Causes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Primary Contributors</Text>
                  <View style={styles.causeRow}>
                    <Text style={styles.causeText}>1. Consecutive Night Shifts (› 4 days)</Text>
                    <Text style={styles.causePct}>42%</Text>
                  </View>
                  <View style={styles.causeRow}>
                    <Text style={styles.causeText}>2. Compressed Rest Intervals</Text>
                    <Text style={styles.causePct}>28%</Text>
                  </View>
                  <View style={styles.causeRow}>
                    <Text style={styles.causeText}>3. Extreme Weather Operations</Text>
                    <Text style={styles.causePct}>15%</Text>
                  </View>
                </View>

                {/* Simulator */}
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Ionicons name="flask" size={20} color={Colors.light.accent} />
                    <Text style={styles.sectionTitle}>Policy Simulator</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: Colors.light.textSecondary, marginBottom: 16 }}>
                    Simulate schedule adjustments across the unit. (Model projection — not guaranteed).
                  </Text>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {['Cap Nights at 3', 'Add 24h Rest', 'Rotate Platoon'].map((opt, i) => (
                      <TouchableOpacity key={opt} style={[styles.simBtn, i === 0 && styles.simBtnActive]}>
                        <Text style={[styles.simBtnText, i === 0 && styles.simBtnTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.simResultBox}>
                    <Text style={{ fontWeight: 'bold', color: Colors.light.success }}>Projected Outcome: Improving</Text>
                    <Text style={{ fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 }}>
                      Recovery deficit expected to resolve within 8 days if policy is implemented.
                    </Text>
                  </View>
                </View>
                
                <View style={{ height: Spacing.eight }} />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  statsRow: { flexDirection: 'row', gap: Spacing.six },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: Spacing.one },
  statValue: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  
  modalContainer: { flex: 1, backgroundColor: Colors.light.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  modalContent: { padding: Spacing.four },
  
  detailHero: { alignItems: 'center', paddingVertical: Spacing.six, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  detailName: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, marginTop: Spacing.two },
  detailState: { fontSize: 16, fontWeight: '600', marginTop: Spacing.one },
  
  section: { marginTop: Spacing.six },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  
  trendGrid: { flexDirection: 'row', gap: Spacing.four },
  trendBox: { flex: 1, backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center' },
  trendLabel: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: Spacing.two },
  trendValue: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.two },
  
  causeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: Colors.light.borderSubtle },
  causeText: { fontSize: 15, color: Colors.light.text },
  causePct: { fontSize: 15, fontWeight: 'bold', color: Colors.light.textSecondary },
  
  simBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, marginRight: Spacing.two },
  simBtnActive: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent },
  simBtnText: { color: Colors.light.textSecondary, fontWeight: '600' },
  simBtnTextActive: { color: '#fff' },
  simResultBox: { backgroundColor: Colors.light.successBg, padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.success },
});
