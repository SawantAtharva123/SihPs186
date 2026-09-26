import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { LineChart } from 'react-native-gifted-charts';
import { analyzeBaseline } from '@/services/analyticsClient';

export default function TrendsScreen() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [baselineData, setBaselineData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Mock series data for 7 days
      const series = [
        { date: '2023-10-01', value: 7.2 },
        { date: '2023-10-02', value: 6.8 },
        { date: '2023-10-03', value: 7.5 },
        { date: '2023-10-04', value: 5.2 },
        { date: '2023-10-05', value: 4.8 },
        { date: '2023-10-06', value: 5.0 },
        { date: '2023-10-07', value: 5.5 },
      ];

      // Format for gifted-charts
      const formattedData = series.map(s => ({
        value: s.value,
        label: s.date.split('-')[2], // day of month
        dataPointText: s.value.toString()
      }));
      setChartData(formattedData);

      try {
        const response = await analyzeBaseline('person_123', 'sleep', series);
        setBaselineData(response.data);
      } catch (error) {
        console.error('ML Baseline Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>My Trends</Text>
      
      {/* ML Baseline Chart */}
      <View style={styles.radarCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={20} color={Colors.light.stateEmerging} />
          <Text style={styles.cardTitle}>SLEEP BASELINE & DEVIATION (ML MODEL)</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.navy} style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={{ marginBottom: 20 }}>
              <LineChart
                data={chartData}
                height={200}
                spacing={45}
                initialSpacing={20}
                color={Colors.light.navy}
                thickness={3}
                startFillColor="rgba(20, 105, 81, 0.3)"
                endFillColor="rgba(20, 105, 81, 0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={0}
                noOfSections={4}
                yAxisColor="white"
                yAxisThickness={0}
                rulesType="solid"
                rulesColor="rgba(0,0,0,0.1)"
                yAxisTextStyle={{ color: 'gray' }}
                xAxisColor="lightgray"
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: 'lightgray',
                  pointerStripWidth: 2,
                  pointerColor: 'lightgray',
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                }}
                showValuesAsDataPointsText
              />
            </View>
            {baselineData && baselineData.median !== undefined && (
              <View style={styles.mlResultsBox}>
                <Text style={styles.mlResultTitle}>ML Baseline Analysis</Text>
                <Text style={styles.mlResultText}>Median Baseline: {baselineData.median?.toFixed(2)}h</Text>
                <Text style={styles.mlResultText}>MAD (Volatility): {baselineData.mad?.toFixed(2)}</Text>
                <Text style={styles.mlResultText}>EWMA Trend: {baselineData.ewma?.toFixed(2)}h</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Stressor Map */}
      <View style={styles.stressorCard}>
        <Text style={styles.cardTitleBlack}>Interactive Stressor Map</Text>
        <Text style={styles.stressorDesc}>Observed relationships contributing to your current variation.</Text>

        <View style={styles.flowContainer}>
          <View style={styles.flowNode}><Text style={styles.nodeText}>Night Shifts (High)</Text></View>
          <Ionicons name="arrow-down" size={20} color={Colors.light.textMuted} style={styles.arrow} />
          
          <View style={styles.flowNode}><Text style={styles.nodeText}>Sleep Duration (+" 5.2h)</Text></View>
          <Ionicons name="arrow-down" size={20} color={Colors.light.textMuted} style={styles.arrow} />
          
          <View style={styles.flowNode}><Text style={styles.nodeText}>Recovery Quality (+" 62%)</Text></View>
          <Ionicons name="arrow-down" size={20} color={Colors.light.textMuted} style={styles.arrow} />
          
          <View style={[styles.flowNode, { backgroundColor: Colors.light.stateEmergingBg, borderColor: Colors.light.stateEmerging }]}>
            <Text style={[styles.nodeText, { color: Colors.light.stateEmerging }]}>Current Deviation</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy, marginBottom: Spacing.four, marginTop: Spacing.two },
  radarCard: { backgroundColor: '#ffffff', padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.four },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.light.stateEmerging, letterSpacing: 0.5 },
  
  mlResultsBox: { backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginTop: 10 },
  mlResultTitle: { fontWeight: 'bold', marginBottom: 4, color: Colors.light.navy },
  mlResultText: { color: Colors.light.textSecondary, marginBottom: 2 },

  stressorCard: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  cardTitleBlack: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
  stressorDesc: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: Spacing.six },
  
  flowContainer: { alignItems: 'center' },
  flowNode: { backgroundColor: Colors.light.background, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.border, minWidth: 200, alignItems: 'center' },
  nodeText: { fontWeight: '600', color: Colors.light.textSecondary },
  arrow: { marginVertical: Spacing.two }
});
