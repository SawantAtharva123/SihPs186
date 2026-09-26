import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { simulatePerson } from '@/services/analyticsClient';
import { useTheme } from '@/context/ThemeContext';

export default function InterventionsScreen() {
  const { colors, isDark } = useTheme();
  const [showLab, setShowLab] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('Add Rest Interval');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const mockInterventions = [
    { id: 'I-102', name: 'Rohan Verma', type: 'Schedule Adjustment', status: 'Active', start: 'Oct 12', end: 'Oct 19' },
    { id: 'I-099', name: 'Vikram Das', type: 'Welfare Check-in', status: 'Completed', start: 'Oct 05', end: 'Oct 05' },
  ];

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const current = { debt: 15, avg_sleep: 5.2 };
      const scenario = { intervention: selectedScenario, duration_days: 7 };
      const res = await simulatePerson('person_123', current, scenario);
      setSimResult(res.data);
    } catch (err) {
      console.error('Simulation Error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const chartData = simResult ? [
    { value: 15, label: 'Current', frontColor: colors.stateSustained },
    { value: simResult.scenario_burden ?? 8, label: 'Projected', frontColor: colors.stateStable }
  ] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>Interventions</Text>
      </View>

      <ScrollView style={styles.list}>
        <TouchableOpacity
          style={[styles.labBtn, { backgroundColor: isDark ? colors.backgroundElement : Colors.light.navy, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => setShowLab(true)}
        >
          <View style={styles.labIcon}><Ionicons name="flask" size={24} color="#fff" /></View>
          <View>
            <Text style={styles.labTitle}>Experiment Lab (ML)</Text>
            <Text style={styles.labSub}>Simulate interventions before applying</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Active Interventions</Text>
        {mockInterventions.map(i => (
          <View key={i.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, { color: colors.text }]}>{i.name}</Text>
              <Text style={[styles.itemId, { color: colors.textSecondary }]}>{i.id}</Text>
            </View>
            <Text style={[styles.itemType, { color: colors.primary }]}>{i.type}</Text>
            <View style={styles.itemFooter}>
              <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{i.start} - {i.end}</Text>
              <Text style={[styles.itemStatus, { color: i.status === 'Active' ? colors.stateEmerging : colors.stateStable }]}>{i.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Experiment Lab Modal */}
      <Modal visible={showLab} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLab(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>ML What-If Simulator</Text>
            <TouchableOpacity onPress={() => setShowLab(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.scenarioLabel, { color: colors.text }]}>Select Scenario for Rohan Verma:</Text>
            {['Add Rest Interval', 'Remove Night Shift', 'Counseling'].map(scen => (
              <TouchableOpacity 
                key={scen} 
                style={[
                  styles.scenarioBtn,
                  { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                  selectedScenario === scen && { backgroundColor: isDark ? '#1E293B' : colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSelectedScenario(scen)}
              >
                <Text style={[
                  styles.scenarioBtnText,
                  { color: colors.text },
                  selectedScenario === scen && { color: '#fff', fontWeight: '700' }
                ]}>{scen}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.runSimBtn, { backgroundColor: colors.stateSustained }]} onPress={handleSimulate}>
              <Text style={styles.runSimText}>Run ML Simulation</Text>
            </TouchableOpacity>

            {simLoading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />}
            
            {simResult && !simLoading && (
              <View style={[styles.simResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.simResultTitle, { color: colors.text }]}>Simulation Outcomes</Text>
                
                <View style={{ marginBottom: 20, marginTop: 10 }}>
                  <BarChart
                    data={chartData}
                    barWidth={40}
                    spacing={60}
                    roundedTop
                    xAxisThickness={0}
                    yAxisThickness={0}
                    noOfSections={3}
                    maxValue={20}
                    xAxisLabelTextStyle={{ color: colors.textSecondary }}
                    yAxisTextStyle={{ color: colors.textSecondary }}
                  />
                </View>
                
                <View style={[styles.mlBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.mlResultTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>Model Projection</Text>
                  <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Expected Direction: <Text style={{fontWeight:'bold', color: colors.text}}>{simResult.direction || 'Improving'}</Text></Text>
                  <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Current Burden: {simResult.current_burden || 15}</Text>
                  <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Projected Burden: {simResult.scenario_burden || 8}</Text>
                  <Text style={[styles.mlResultText, { color: colors.stateEmerging, marginTop: 8, fontSize: 12 }]}>
                    * {simResult.warning || 'This is a model simulation, not a guaranteed outcome.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.four },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: Spacing.four },
  
  labBtn: { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.six },
  labIcon: { marginRight: Spacing.three },
  labTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  labSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: Spacing.three },
  itemCard: { padding: Spacing.four, borderRadius: Radius.md, marginBottom: Spacing.three, borderWidth: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemId: { fontSize: 13 },
  itemType: { fontWeight: '600', marginBottom: Spacing.three },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { fontSize: 13 },
  itemStatus: { fontSize: 12, fontWeight: 'bold' },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: Spacing.four },
  
  scenarioLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: Spacing.three },
  scenarioBtn: { padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.two },
  scenarioBtnText: { textAlign: 'center', fontWeight: '500' },

  runSimBtn: { padding: Spacing.four, borderRadius: Radius.md, marginTop: Spacing.four, alignItems: 'center' },
  runSimText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  simResultCard: { marginTop: Spacing.six, padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1 },
  simResultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Spacing.four },

  mlBox: { padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  mlResultTitle: { fontWeight: 'bold', marginBottom: 4, fontSize: 15 },
  mlResultText: { marginBottom: 2, fontSize: 14 },
});
