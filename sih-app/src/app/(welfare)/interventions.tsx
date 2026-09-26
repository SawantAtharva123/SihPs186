import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { simulatePerson } from '@/services/analyticsClient';

export default function InterventionsScreen() {
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
    { value: 15, label: 'Current', frontColor: Colors.light.stateSustained },
    { value: simResult.scenario_burden ?? 8, label: 'Projected', frontColor: Colors.light.stateStable }
  ] : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Interventions</Text>
      </View>

      <ScrollView style={styles.list}>
        <TouchableOpacity style={styles.labBtn} onPress={() => setShowLab(true)}>
          <View style={styles.labIcon}><Ionicons name="flask" size={24} color="#fff" /></View>
          <View>
            <Text style={styles.labTitle}>Experiment Lab (ML)</Text>
            <Text style={styles.labSub}>Simulate interventions before applying</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Active Interventions</Text>
        {mockInterventions.map(i => (
          <View key={i.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{i.name}</Text>
              <Text style={styles.itemId}>{i.id}</Text>
            </View>
            <Text style={styles.itemType}>{i.type}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>{i.start} - {i.end}</Text>
              <Text style={[styles.itemStatus, i.status === 'Active' ? styles.statusActive : styles.statusCompleted]}>{i.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Experiment Lab Modal */}
      <Modal visible={showLab} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ML What-If Simulator</Text>
            <TouchableOpacity onPress={() => setShowLab(false)}><Ionicons name="close" size={24} color={Colors.light.text} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.scenarioLabel}>Select Scenario for Rohan Verma:</Text>
            {['Add Rest Interval', 'Remove Night Shift', 'Counseling'].map(scen => (
              <TouchableOpacity 
                key={scen} 
                style={[styles.scenarioBtn, selectedScenario === scen && styles.scenarioBtnActive]}
                onPress={() => setSelectedScenario(scen)}
              >
                <Text style={[styles.scenarioBtnText, selectedScenario === scen && styles.scenarioBtnTextActive]}>{scen}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.runSimBtn} onPress={handleSimulate}>
              <Text style={styles.runSimText}>Run ML Simulation</Text>
            </TouchableOpacity>

            {simLoading && <ActivityIndicator size="large" color={Colors.light.navy} style={{ marginTop: 40 }} />}
            
            {simResult && !simLoading && (
              <View style={styles.simResultCard}>
                <Text style={styles.simResultTitle}>Simulation Outcomes</Text>
                
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
                  />
                </View>
                
                <View style={styles.mlBox}>
                  <Text style={styles.mlResultTitle}>Model Projection</Text>
                  <Text style={styles.mlResultText}>Expected Direction: <Text style={{fontWeight:'bold'}}>{simResult.direction || 'Improving'}</Text></Text>
                  <Text style={styles.mlResultText}>Current Burden: {simResult.current_burden || 15}</Text>
                  <Text style={styles.mlResultText}>Projected Burden: {simResult.scenario_burden || 8}</Text>
                  <Text style={[styles.mlResultText, { color: Colors.light.stateEmerging, marginTop: 8, fontSize: 12 }]}>
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
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, paddingTop: Spacing.six },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  list: { padding: Spacing.four },
  
  labBtn: { flexDirection: 'row', backgroundColor: Colors.light.navy, padding: Spacing.four, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.six },
  labIcon: { marginRight: Spacing.three },
  labTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  labSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.textSecondary, marginBottom: Spacing.three },
  itemCard: { backgroundColor: '#fff', padding: Spacing.four, borderRadius: Radius.md, marginBottom: Spacing.three, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  itemId: { color: Colors.light.textSecondary, fontSize: 13 },
  itemType: { color: Colors.light.navy, fontWeight: '500', marginBottom: Spacing.three },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { color: Colors.light.textSecondary, fontSize: 13 },
  itemStatus: { fontSize: 12, fontWeight: 'bold' },
  statusActive: { color: Colors.light.stateEmerging },
  statusCompleted: { color: Colors.light.stateStable },

  modalContainer: { flex: 1, backgroundColor: Colors.light.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.four, borderBottomWidth: 1, borderColor: Colors.light.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.navy },
  modalBody: { padding: Spacing.four },
  
  scenarioLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: Spacing.three },
  scenarioBtn: { padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.border, marginBottom: Spacing.two },
  scenarioBtnActive: { backgroundColor: Colors.light.navy, borderColor: Colors.light.navy },
  scenarioBtnText: { color: Colors.light.text, textAlign: 'center', fontWeight: '500' },
  scenarioBtnTextActive: { color: '#fff' },

  runSimBtn: { backgroundColor: Colors.light.stateSustained, padding: Spacing.four, borderRadius: Radius.md, marginTop: Spacing.four, alignItems: 'center' },
  runSimText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  simResultCard: { marginTop: Spacing.six, backgroundColor: '#fff', padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  simResultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Spacing.four },

  mlBox: { backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  mlResultTitle: { fontWeight: 'bold', marginBottom: 4, color: Colors.light.navy, fontSize: 15 },
  mlResultText: { color: Colors.light.textSecondary, marginBottom: 2, fontSize: 14 },
});
