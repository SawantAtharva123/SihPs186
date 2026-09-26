import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import TeamNetworkGraph from '@/components/charts/TeamNetworkGraph';
import { useTheme } from '@/context/ThemeContext';

export default function CommandUnitsScreen() {
  const { colors, isDark } = useTheme();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const mockUnits = [
    { id: 'u1', name: 'Unit 402', headcount: 124, state: 'Stable', stateColor: colors.stateStable, weatherIcon: 'sunny' },
    { id: 'u2', name: 'North Zone', headcount: 312, state: 'Emerging Change', stateColor: colors.stateEmerging, weatherIcon: 'partly-sunny' },
    { id: 'u3', name: 'Training Wing', headcount: 85, state: 'Persistent Deviation', stateColor: colors.statePersistent, weatherIcon: 'rainy' },
    { id: 'u4', name: 'Deployment Unit', headcount: 450, state: 'Sustained Concern', stateColor: colors.stateSustained, weatherIcon: 'thunderstorm' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>Unit Readiness & Network</Text>
      </View>

      <ScrollView style={styles.list}>
        <TeamNetworkGraph />
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 12 }}>
          OPERATIONAL UNITS
        </Text>
        {mockUnits.map(u => (
          <TouchableOpacity
            key={u.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedUnit(u)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield" size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{u.name}</Text>
              </View>
              <Ionicons name={u.weatherIcon as any} size={28} color={u.stateColor} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Headcount</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{u.headcount}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>State</Text>
                <Text style={[styles.statValue, { color: u.stateColor }]}>{u.state}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal visible={!!selectedUnit} animationType="slide" onRequestClose={() => setSelectedUnit(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedUnit(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedUnit?.name} Detail</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedUnit && (
              <>
                <View style={[styles.detailHero, { borderBottomColor: colors.border }]}>
                  <Ionicons name={selectedUnit.weatherIcon as any} size={64} color={selectedUnit.stateColor} />
                  <Text style={[styles.detailName, { color: colors.text }]}>{selectedUnit.name}</Text>
                  <Text style={[styles.detailState, { color: selectedUnit.stateColor }]}>{selectedUnit.state}</Text>
                </View>

                {/* Trend Analysis */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Trend Analysis (Last 30 Days)</Text>
                  <View style={styles.trendGrid}>
                    <View style={[styles.trendBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                      <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Recovery</Text>
                      <Text style={[styles.trendValue, { color: colors.text }]}>-12%</Text>
                      <Ionicons name="trending-down" size={20} color={colors.stateSustained} />
                    </View>
                    <View style={[styles.trendBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                      <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Workload</Text>
                      <Text style={[styles.trendValue, { color: colors.text }]}>+24%</Text>
                      <Ionicons name="trending-up" size={20} color={colors.stateSustained} />
                    </View>
                  </View>
                </View>

                {/* Root Causes */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Contributors</Text>
                  <View style={[styles.causeRow, { borderBottomColor: colors.borderSubtle }]}>
                    <Text style={[styles.causeText, { color: colors.text }]}>1. Consecutive Night Shifts (› 4 days)</Text>
                    <Text style={[styles.causePct, { color: colors.textSecondary }]}>42%</Text>
                  </View>
                  <View style={[styles.causeRow, { borderBottomColor: colors.borderSubtle }]}>
                    <Text style={[styles.causeText, { color: colors.text }]}>2. Compressed Rest Intervals</Text>
                    <Text style={[styles.causePct, { color: colors.textSecondary }]}>28%</Text>
                  </View>
                  <View style={[styles.causeRow, { borderBottomColor: colors.borderSubtle }]}>
                    <Text style={[styles.causeText, { color: colors.text }]}>3. Extreme Weather Operations</Text>
                    <Text style={[styles.causePct, { color: colors.textSecondary }]}>15%</Text>
                  </View>
                </View>

                {/* Simulator */}
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Ionicons name="flask" size={20} color={colors.accent} />
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Policy Simulator</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
                    Simulate schedule adjustments across the unit. (Model projection — not guaranteed).
                  </Text>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {['Cap Nights at 3', 'Add 24h Rest', 'Rotate Platoon'].map((opt, i) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.simBtn,
                          { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                          i === 0 && { backgroundColor: colors.accent, borderColor: colors.accent }
                        ]}
                      >
                        <Text style={[
                          styles.simBtnText,
                          { color: colors.textSecondary },
                          i === 0 && styles.simBtnTextActive
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={[styles.simResultBox, { backgroundColor: isDark ? '#064E3B33' : '#ECFDF5', borderColor: isDark ? '#05966955' : '#A7F3D0' }]}>
                    <Text style={{ fontWeight: 'bold', color: colors.success }}>Projected Outcome: Improving</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
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
  container: { flex: 1 },
  header: { padding: Spacing.four, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: Spacing.four },
  card: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: Spacing.six },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, marginBottom: Spacing.one },
  statValue: { fontSize: 16, fontWeight: '600' },
  
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { padding: Spacing.four },
  
  detailHero: { alignItems: 'center', paddingVertical: Spacing.six, borderBottomWidth: 1 },
  detailName: { fontSize: 28, fontWeight: 'bold', marginTop: Spacing.two },
  detailState: { fontSize: 16, fontWeight: '600', marginTop: Spacing.one },
  
  section: { marginTop: Spacing.six },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: Spacing.four },
  
  trendGrid: { flexDirection: 'row', gap: Spacing.four },
  trendBox: { flex: 1, padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  trendLabel: { fontSize: 13, marginBottom: Spacing.two },
  trendValue: { fontSize: 24, fontWeight: 'bold', marginBottom: Spacing.two },
  
  causeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.three, borderBottomWidth: 1 },
  causeText: { fontSize: 15 },
  causePct: { fontSize: 15, fontWeight: 'bold' },
  
  simBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: Spacing.two },
  simBtnText: { fontWeight: '600' },
  simBtnTextActive: { color: '#fff' },
  simResultBox: { padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1 },
});
