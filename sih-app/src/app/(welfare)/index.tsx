import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { analyzeSignalAgreement } from '@/services/analyticsClient';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function WelfareDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [signalData, setSignalData] = useState<any>(null);

  const statuses = [
    { label: 'Stable', count: 48, color: colors.stateStable },
    { label: 'Emerging', count: 6, color: colors.stateEmerging },
    { label: 'Persistent', count: 3, color: colors.statePersistent },
    { label: 'Sustained', count: 1, color: colors.stateSustained },
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
        console.warn('Welfare ML fallback active:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMLData();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Welfare Dashboard</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Unit 402 · AI Health Overview</Text>
      </FadeInView>

      {/* Status Distribution Pie Chart */}
      <FadeInView delay={100}>
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STATUS DISTRIBUTION</Text>
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
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, color: colors.text, fontWeight: 'bold' }}>58</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total</Text>
                  </View>
                );
              }}
            />
            <View style={styles.legendContainer}>
              {statuses.map(s => (
                <View key={s.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </FadeInView>

      {/* ML Signal Agreement */}
      <FadeInView delay={150}>
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ML SIGNAL AGREEMENT (UNIT AGGREGATE)</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 15 }} />
          ) : (
            <View style={[styles.mlBox, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border }]}>
              <Text style={[styles.mlResultTitle, { color: colors.text }]}>Agreement Level: {signalData?.agreement_level || 'Consistent Signal'}</Text>
              <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Conflict Detected: {signalData?.conflict ? 'Yes' : 'No'}</Text>
              {signalData?.missing_count !== undefined && (
                <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Missing Signals: {signalData?.missing_count}</Text>
              )}
            </View>
          )}
        </View>
      </FadeInView>

      {/* Priority Personnel */}
      <FadeInView delay={200}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIORITY PERSONNEL</Text>
            <TouchableOpacity onPress={() => router.push('/(welfare)/personnel')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          <BouncyPressable
            style={[styles.personCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(welfare)/personnel')}
          >
            <View style={styles.personHeader}>
              <Text style={[styles.personName, { color: colors.text }]}>Personnel 104</Text>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(231, 76, 60, 0.15)' : colors.stateSustainedBg }]}>
                <Text style={[styles.badgeText, { color: colors.stateSustained }]}>Sustained Concern</Text>
              </View>
            </View>
            <Text style={[styles.personContext, { color: colors.textSecondary }]}>
              Repeated night-to-day transitions. Sleep significantly below baseline.
            </Text>
          </BouncyPressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, marginTop: 2, marginBottom: Spacing.five },
  
  chartCard: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.five, borderWidth: 1 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  legendContainer: { justifyContent: 'center', marginLeft: 20 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 13 },

  section: { marginBottom: Spacing.six },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  seeAll: { fontWeight: '700', fontSize: 13 },
  
  personCard: { padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.three },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  personName: { fontSize: 16, fontWeight: '700' },
  personContext: { fontSize: 13, lineHeight: 19 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  mlBox: { padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  mlResultTitle: { fontWeight: '700', marginBottom: 4, fontSize: 14 },
  mlResultText: { marginBottom: 2, fontSize: 13 },
});
