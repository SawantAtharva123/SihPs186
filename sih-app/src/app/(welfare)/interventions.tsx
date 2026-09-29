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
      const current = {
        sleep_hours: 5.2,
        workload: 4.2,
        night_shifts_per_week: 3.0,
        duty_hours: 10.0,
        rest_hours: 6.0,
        recovery_time_hours: 1.5,
        avg_sleep: 5.2,
        debt: 15,
      };

      let scenarioParams: Record<string, any> = {};
      if (selectedScenario === 'Add Rest Interval') {
        scenarioParams = {
          rest_hours: 12.0,
          sleep_hours: 6.8,
          recovery_time_hours: 3.5,
        };
      } else if (selectedScenario === 'Remove Night Shift') {
        scenarioParams = {
          night_shifts_per_week: 0.0,
          sleep_hours: 7.2,
          duty_hours: 8.0,
          recovery_time_hours: 3.0,
        };
      } else if (selectedScenario === 'Counseling') {
        scenarioParams = {
          workload: 2.8,
          recovery_time_hours: 3.5,
          sleep_hours: 6.5,
        };
      }

      const scenario = {
        ...scenarioParams,
        intervention: selectedScenario,
        duration_days: 7,
      };

      const res = await simulatePerson('person_123', current, scenario);
      setSimResult(res.data);
    } catch (err) {
      console.error('Simulation Error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const currentBurdenVal = Math.round(simResult?.current_burden ?? 76);
  const scenarioBurdenVal = Math.round(simResult?.scenario_burden ?? 52);

  const chartData = simResult ? [
    {
      value: currentBurdenVal,
      label: 'Current',
      frontColor: colors.stateSustained,
      topLabelComponent: () => (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
          {currentBurdenVal}
        </Text>
      ),
    },
    {
      value: scenarioBurdenVal,
      label: 'Projected',
      frontColor: colors.stateStable,
      topLabelComponent: () => (
        <Text style={{ color: colors.stateStable, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
          {scenarioBurdenVal}
        </Text>
      ),
    },
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
                    barWidth={48}
                    spacing={60}
                    roundedTop
                    xAxisThickness={1}
                    xAxisColor={colors.border}
                    yAxisThickness={0}
                    noOfSections={4}
                    maxValue={100}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                  />
                </View>
                
                <View style={[styles.mlBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.mlResultTitle, { color: isDark ? '#F8FAFC' : colors.navy, marginBottom: 0 }]}>Model Projection</Text>
                    <View style={{
                      backgroundColor: simResult.direction === 'improving' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                    }}>
                      <Text style={{
                        color: simResult.direction === 'improving' ? '#16a34a' : colors.primary,
                        fontSize: 12,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}>
                        {simResult.direction || 'Improving'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>
                    Current Burden: <Text style={{ fontWeight: 'bold', color: colors.text }}>{simResult.current_burden} / 100</Text>
                  </Text>
                  <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>
                    Projected Burden: <Text style={{ fontWeight: 'bold', color: colors.stateStable }}>{simResult.scenario_burden} / 100</Text>
                    {simResult.delta != null && (
                      <Text style={{ color: simResult.delta < 0 ? '#16a34a' : colors.stateSustained, fontWeight: '700' }}>
                        {' '}({simResult.delta > 0 ? `+${simResult.delta}` : simResult.delta} pts)
                      </Text>
                    )}
                  </Text>
                  {simResult.scenario_params && (
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Target Parameters: {simResult.scenario_params.sleep_hours ? `${simResult.scenario_params.sleep_hours}h sleep` : ''}
                        {simResult.scenario_params.rest_hours ? ` • ${simResult.scenario_params.rest_hours}h rest` : ''}
                        {simResult.scenario_params.night_shifts_per_week != null ? ` • ${simResult.scenario_params.night_shifts_per_week} night shifts/wk` : ''}
                      </Text>
                    </View>
                  )}
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
