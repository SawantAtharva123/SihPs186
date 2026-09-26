import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function CommandDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const units = [
    { name: 'North Zone', state: 'Stable', icon: 'sunny', color: colors.stateStable, bg: isDark ? 'rgba(46, 204, 113, 0.15)' : colors.stateStableBg, desc: 'Normal baseline metrics.' },
    { name: 'Central Ops', state: 'Emerging Change', icon: 'partly-sunny', color: colors.stateEmerging, bg: isDark ? 'rgba(243, 156, 18, 0.15)' : colors.stateEmergingBg, desc: 'Elevated routine volatility.' },
    { name: 'Training Wing', state: 'Elevated Pressure', icon: 'rainy', color: colors.statePersistent, bg: isDark ? 'rgba(230, 126, 34, 0.15)' : colors.statePersistentBg, desc: 'High consecutive duties.' },
    { name: 'Deployment Unit', state: 'Improving', icon: 'trending-up', color: colors.success, bg: isDark ? 'rgba(46, 204, 113, 0.15)' : colors.successBg, desc: 'Post-intervention recovery.' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Organization Dashboard</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Northern Command Aggregate Analytics</Text>
      </FadeInView>

      {/* Wellness Weather */}
      <FadeInView delay={100}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WELLNESS WEATHER</Text>
          </View>
          <View style={styles.grid}>
            {units.map((u, i) => (
              <BouncyPressable
                key={i}
                style={[styles.weatherCard, { backgroundColor: u.bg, borderColor: u.color + '40' }]}
                onPress={() => router.push('/(command)/units')}
              >
                <View style={styles.weatherCardHeader}>
                  <Ionicons name={u.icon as any} size={24} color={u.color} />
                  <Text style={[styles.weatherState, { color: u.color }]}>{u.state}</Text>
                </View>
                <Text style={[styles.weatherUnitName, { color: colors.text }]}>{u.name}</Text>
                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]}>{u.desc}</Text>
              </BouncyPressable>
            ))}
          </View>
        </View>
      </FadeInView>

      {/* Organization Trend Summary */}
      <FadeInView delay={150}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitleBlack, { color: colors.text }]}>Organization Trend Summary</Text>
          <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>Compared with previous 30 days</Text>
          
          <View style={[styles.trendList, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={[styles.trendRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.trendLabel, { color: colors.text }]}>Recovery Pressure</Text>
              <View style={[styles.trendValueBadge, { backgroundColor: isDark ? colors.backgroundTertiary : colors.background }]}>
                <Text style={[styles.trendValue, { color: colors.stateSustained }]}>↑ +12%</Text>
              </View>
            </View>
            <View style={[styles.trendRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.trendLabel, { color: colors.text }]}>Schedule Volatility</Text>
              <View style={[styles.trendValueBadge, { backgroundColor: isDark ? colors.backgroundTertiary : colors.background }]}>
                <Text style={[styles.trendValue, { color: colors.statePersistent }]}>↑ Elevated</Text>
              </View>
            </View>
            <View style={[styles.trendRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.trendLabel, { color: colors.text }]}>Cumulative Load</Text>
              <View style={[styles.trendValueBadge, { backgroundColor: isDark ? colors.backgroundTertiary : colors.background }]}>
                <Text style={[styles.trendValue, { color: colors.textSecondary }]}>→ Stable</Text>
              </View>
            </View>
            <View style={[styles.trendRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.trendLabel, { color: colors.text }]}>Unit Pulse</Text>
              <View style={[styles.trendValueBadge, { backgroundColor: isDark ? colors.backgroundTertiary : colors.background }]}>
                <Text style={[styles.trendValue, { color: colors.stateEmerging }]}>↓ Decreasing</Text>
              </View>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* Intervention Outcomes */}
      <FadeInView delay={200}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitleBlack, { color: colors.text }]}>Recent Intervention Outcomes</Text>
          <BouncyPressable
            style={[styles.outcomeCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(command)/units')}
          >
            <View style={styles.outcomeHeader}>
              <Text style={[styles.outcomeUnit, { color: colors.text }]}>Training Wing: Shift Adjustment</Text>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : colors.successBg }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>Observed Improvement</Text>
              </View>
            </View>
            <Text style={[styles.outcomeDesc, { color: colors.textSecondary }]}>
              Recovery Pressure: 72 → 64. Schedule Volatility: High → Moderate.
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
  headerTitle: { fontSize: 24, fontWeight: '800', marginTop: Spacing.two },
  headerSubtitle: { fontSize: 14, marginBottom: Spacing.five, marginTop: 2 },
  
  section: { marginBottom: Spacing.six },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  sectionTitleBlack: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  comparisonText: { fontSize: 12, marginBottom: Spacing.three },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  weatherCard: { width: '48%', padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1 },
  weatherCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  weatherState: { fontSize: 11, fontWeight: '800', maxWidth: '70%', textAlign: 'right' },
  weatherUnitName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  weatherDesc: { fontSize: 12, lineHeight: 16 },

  trendList: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  trendLabel: { fontSize: 14, fontWeight: '600' },
  trendValueBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  trendValue: { fontSize: 13, fontWeight: '800' },

  outcomeCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, marginTop: Spacing.two },
  outcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  outcomeUnit: { fontSize: 14, fontWeight: '700' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  outcomeDesc: { fontSize: 13, lineHeight: 18 }
});
