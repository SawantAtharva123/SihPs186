import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function CommandDashboardScreen() {
  const router = useRouter();

  const units = [
    { name: 'North Zone', state: 'Stable', icon: 'sunny', color: Colors.light.stateStable, bg: Colors.light.stateStableBg, desc: 'Normal baseline metrics.' },
    { name: 'Central Ops', state: 'Emerging Change', icon: 'partly-sunny', color: Colors.light.stateEmerging, bg: Colors.light.stateEmergingBg, desc: 'Elevated routine volatility.' },
    { name: 'Training Wing', state: 'Elevated Pressure', icon: 'rainy', color: Colors.light.statePersistent, bg: Colors.light.statePersistentBg, desc: 'High consecutive duties.' },
    { name: 'Deployment Unit', state: 'Improving', icon: 'trending-up', color: Colors.light.success, bg: Colors.light.successBg, desc: 'Post-intervention recovery.' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Organization Dashboard</Text>
      <Text style={styles.headerSubtitle}>Northern Command Aggregate Analytics</Text>

      {/* Wellness Weather */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.sectionTitle}>WELLNESS WEATHER</Text>
        </View>
        <View style={styles.grid}>
          {units.map((u, i) => (
            <TouchableOpacity key={i} style={[styles.weatherCard, { backgroundColor: u.bg, borderColor: u.color + '40' }]} onPress={() => router.push('/(command)/units')}>
              <View style={styles.weatherCardHeader}>
                <Ionicons name={u.icon as any} size={24} color={u.color} />
                <Text style={[styles.weatherState, { color: u.color }]}>{u.state}</Text>
              </View>
              <Text style={styles.weatherUnitName}>{u.name}</Text>
              <Text style={styles.weatherDesc}>{u.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Organization Trend Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleBlack}>Organization Trend Summary</Text>
        <Text style={styles.comparisonText}>Compared with previous 30 days</Text>
        
        <View style={styles.trendList}>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Recovery Pressure</Text>
            <View style={styles.trendValueBadge}><Text style={[styles.trendValue, { color: Colors.light.stateSustained }]}>↑ +12%</Text></View>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Schedule Volatility</Text>
            <View style={styles.trendValueBadge}><Text style={[styles.trendValue, { color: Colors.light.statePersistent }]}>↑ Elevated</Text></View>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Cumulative Load</Text>
            <View style={styles.trendValueBadge}><Text style={[styles.trendValue, { color: Colors.light.textSecondary }]}>→ Stable</Text></View>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Unit Pulse</Text>
            <View style={styles.trendValueBadge}><Text style={[styles.trendValue, { color: Colors.light.stateEmerging }]}>↓ Decreasing</Text></View>
          </View>
        </View>
      </View>

      {/* Intervention Outcomes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleBlack}>Recent Intervention Outcomes</Text>
        <TouchableOpacity style={styles.outcomeCard} onPress={() => router.push('/(command)/units')}>
          <View style={styles.outcomeHeader}>
            <Text style={styles.outcomeUnit}>Training Wing: Shift Adjustment</Text>
            <View style={[styles.badge, { backgroundColor: Colors.light.successBg }]}><Text style={[styles.badgeText, { color: Colors.light.success }]}>Observed Improvement</Text></View>
          </View>
          <Text style={styles.outcomeDesc}>Recovery Pressure: 72 → 64. Schedule Volatility: High → Moderate.</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy, marginTop: Spacing.two },
  headerSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: Spacing.six },
  
  section: { marginBottom: Spacing.six },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.textMuted, letterSpacing: 1 },
  sectionTitleBlack: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  comparisonText: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: Spacing.three },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  weatherCard: { width: '48%', padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1 },
  weatherCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  weatherState: { fontSize: 11, fontWeight: 'bold', maxWidth: '70%', textAlign: 'right' },
  weatherUnitName: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
  weatherDesc: { fontSize: 12, color: Colors.light.textSecondary, lineHeight: 16 },

  trendList: { backgroundColor: Colors.light.backgroundElement, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.borderSubtle, overflow: 'hidden' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1, borderBottomColor: Colors.light.borderSubtle },
  trendLabel: { fontSize: 15, fontWeight: '500', color: Colors.light.text },
  trendValueBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: Colors.light.background },
  trendValue: { fontSize: 14, fontWeight: 'bold' },

  outcomeCard: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.borderSubtle, marginTop: Spacing.two },
  outcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  outcomeUnit: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  outcomeDesc: { fontSize: 13, color: Colors.light.textSecondary }
});
