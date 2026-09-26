import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { analyzeSignalAgreement } from '@/services/analyticsClient';

export default function WelfareDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signalData, setSignalData] = useState<any>(null);

  const statuses = [
    { label: 'Stable', count: 48, color: Colors.light.stateStable, bg: Colors.light.stateStableBg },
    { label: 'Emerging', count: 6, color: Colors.light.stateEmerging, bg: Colors.light.stateEmergingBg },
    { label: 'Persistent', count: 3, color: Colors.light.statePersistent, bg: Colors.light.statePersistentBg },
    { label: 'Sustained', count: 1, color: Colors.light.stateSustained, bg: Colors.light.stateSustainedBg },
  ];

  const pieData = statuses.map(s => ({
    value: s.count,
    color: s.color,
    text: s.count.toString(),
  }));

  useEffect(() => {
    const fetchMLData = async () => {
      try {
        const signals = {
          sleep: 'declining',
          duty: 'stable',
          recovery: 'improving',
          activity: 'stable'
        };
        const res = await analyzeSignalAgreement('unit_402_aggregate', signals);
        setSignalData(res.data);
      } catch (err) {
        console.error('Welfare ML Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMLData();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Welfare Dashboard</Text>
      <Text style={styles.headerSubtitle}>Unit 402 - ML Overview</Text>

      {/* Status Distribution Pie Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>STATUS DISTRIBUTION</Text>
        <View style={styles.pieContainer}>
          <PieChart
            data={pieData}
            donut
            showText
            textColor="white"
            radius={90}
            innerRadius={50}
            textSize={14}
            focusOnPress
            centerLabelComponent={() => {
              return (
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={{fontSize: 22, color: Colors.light.navy, fontWeight: 'bold'}}>58</Text>
                  <Text style={{fontSize: 12, color: Colors.light.textSecondary}}>Total</Text>
                </View>
              );
            }}
          />
          <View style={styles.legendContainer}>
            {statuses.map(s => (
              <View key={s.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ML Signal Agreement */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>ML SIGNAL AGREEMENT (UNIT AGGREGATE)</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.light.navy} />
        ) : (
          <View style={styles.mlBox}>
            <Text style={styles.mlResultTitle}>Agreement Level: {signalData?.agreement_level || 'Unknown'}</Text>
            <Text style={styles.mlResultText}>Conflict Detected: {signalData?.conflict ? 'Yes' : 'No'}</Text>
            {signalData?.missing_count !== undefined && (
              <Text style={styles.mlResultText}>Missing Signals: {signalData?.missing_count}</Text>
            )}
          </View>
        )}
      </View>

      {/* Priority Personnel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PRIORITY PERSONNEL</Text>
          <TouchableOpacity onPress={() => router.push('/(welfare)/personnel')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.personCard} onPress={() => router.push('/(welfare)/personnel')}>
          <View style={styles.personHeader}>
            <Text style={styles.personName}>Personnel 104</Text>
            <View style={[styles.badge, { backgroundColor: Colors.light.stateSustainedBg }]}>
              <Text style={[styles.badgeText, { color: Colors.light.stateSustained }]}>Sustained Concern</Text>
            </View>
          </View>
          <Text style={styles.personContext}>Repeated night-to-day transitions. Sleep significantly below baseline.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  headerSubtitle: { fontSize: 16, color: Colors.light.textSecondary, marginBottom: Spacing.six },
  
  chartCard: { backgroundColor: '#ffffff', padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  legendContainer: { justifyContent: 'center', marginLeft: 20 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 13, color: Colors.light.textSecondary },

  section: { marginBottom: Spacing.six },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.light.textSecondary, letterSpacing: 0.5 },
  seeAll: { color: Colors.light.navy, fontWeight: '600', fontSize: 14 },
  
  personCard: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.borderSubtle, marginBottom: Spacing.three },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  personName: { fontSize: 16, fontWeight: 'bold', color: Colors.light.navy },
  personContext: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  mlBox: { backgroundColor: Colors.light.background, padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  mlResultTitle: { fontWeight: 'bold', marginBottom: 4, color: Colors.light.navy, fontSize: 15 },
  mlResultText: { color: Colors.light.textSecondary, marginBottom: 2, fontSize: 14 },
});
