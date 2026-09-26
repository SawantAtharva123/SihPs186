import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { BarChart } from 'react-native-gifted-charts';
import { analyzeRecovery, getRecommendations } from '@/services/analyticsClient';

export default function RecoveryScreen() {
  const [loading, setLoading] = useState(true);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const payload = {
          current_debt: 12,
          recent_sleep: 5.5,
          recent_workload: 'high'
        };
        const recRes = await analyzeRecovery('person_123', payload);
        setRecoveryData(recRes.data);

        const bundle = {
          recovery_debt: 12,
          stressors: ['sleep', 'night_shifts']
        };
        const recs = await getRecommendations('person_123', bundle);
        setRecommendations(recs.data);
      } catch (error) {
        console.error('ML Recovery Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const barData = [
    { value: 5, label: 'Mon', frontColor: Colors.light.stateStable },
    { value: 8, label: 'Tue', frontColor: Colors.light.stateEmerging },
    { value: 12, label: 'Wed', frontColor: Colors.light.stateSustained },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Recovery Engine</Text>

      {/* Recovery Debt Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>RECOVERY DEBT (ML MODEL)</Text>
        <View style={{ marginBottom: 20 }}>
          <BarChart
            data={barData}
            barWidth={30}
            spacing={40}
            roundedTop
            roundedBottom
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: 'gray' }}
            noOfSections={3}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.light.navy} />
        ) : (
          <View style={styles.mlBox}>
            <Text style={styles.mlResultTitle}>ML Recovery Estimates</Text>
            {recoveryData?.recovery_debt !== undefined && (
              <Text style={styles.mlResultText}>Current Debt: {recoveryData.recovery_debt}</Text>
            )}
            {recoveryData?.estimated_half_life !== undefined && (
              <Text style={styles.mlResultText}>Estimated Half-Life: {recoveryData.estimated_half_life} Days</Text>
            )}
            {recoveryData?.trajectory !== undefined && (
              <Text style={styles.mlResultText}>Trajectory: {recoveryData.trajectory}</Text>
            )}
          </View>
        )}
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>RECOMMENDED INTERVENTIONS</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.light.navy} />
        ) : recommendations?.recommendations?.length > 0 ? (
          recommendations.recommendations.map((rec: any, idx: number) => (
            <View key={idx} style={styles.recItem}>
              <Ionicons name="bulb-outline" size={20} color={Colors.light.navy} />
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>{rec.title || 'Suggestion'}</Text>
                <Text style={styles.recDesc}>{rec.description || rec}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.recItem}>
            <Ionicons name="bulb-outline" size={20} color={Colors.light.navy} />
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>Restful Sleep</Text>
              <Text style={styles.recDesc}>Prioritize 8+ hours of uninterrupted sleep for 2 days to clear current recovery debt.</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy, marginBottom: Spacing.four },
  
  card: { backgroundColor: '#ffffff', padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.light.navy, letterSpacing: 0.5, marginBottom: Spacing.four },

  mlBox: { backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  mlResultTitle: { fontWeight: 'bold', marginBottom: 4, color: Colors.light.navy, fontSize: 15 },
  mlResultText: { color: Colors.light.textSecondary, marginBottom: 2, fontSize: 14 },

  recItem: { flexDirection: 'row', gap: Spacing.three, backgroundColor: Colors.light.backgroundElement, padding: Spacing.three, borderRadius: Radius.md, marginBottom: Spacing.three },
  recContent: { flex: 1 },
  recTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  recDesc: { fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
});
