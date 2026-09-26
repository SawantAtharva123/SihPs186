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
            <View style={styles.gridRow}>
              <BouncyPressable
                style={[styles.weatherCard, { backgroundColor: units[0].bg, borderColor: units[0].color + '40' }]}
                onPress={() => router.push('/(command)/units')}
              >
                <View style={styles.weatherCardHeader}>
                  <Ionicons name={units[0].icon as any} size={22} color={units[0].color} />
                  <Text style={[styles.weatherState, { color: units[0].color }]} numberOfLines={1}>{units[0].state}</Text>
                </View>
                <Text style={[styles.weatherUnitName, { color: colors.text }]} numberOfLines={1}>{units[0].name}</Text>
                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]} numberOfLines={2}>{units[0].desc}</Text>
              </BouncyPressable>

              <BouncyPressable
                style={[styles.weatherCard, { backgroundColor: units[1].bg, borderColor: units[1].color + '40' }]}
                onPress={() => router.push('/(command)/units')}
              >
                <View style={styles.weatherCardHeader}>
                  <Ionicons name={units[1].icon as any} size={22} color={units[1].color} />
                  <Text style={[styles.weatherState, { color: units[1].color }]} numberOfLines={1}>{units[1].state}</Text>
                </View>
                <Text style={[styles.weatherUnitName, { color: colors.text }]} numberOfLines={1}>{units[1].name}</Text>
                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]} numberOfLines={2}>{units[1].desc}</Text>
              </BouncyPressable>
            </View>

            <View style={styles.gridRow}>
              <BouncyPressable
                style={[styles.weatherCard, { backgroundColor: units[2].bg, borderColor: units[2].color + '40' }]}
                onPress={() => router.push('/(command)/units')}
              >
                <View style={styles.weatherCardHeader}>
                  <Ionicons name={units[2].icon as any} size={22} color={units[2].color} />
                  <Text style={[styles.weatherState, { color: units[2].color }]} numberOfLines={1}>{units[2].state}</Text>
                </View>
                <Text style={[styles.weatherUnitName, { color: colors.text }]} numberOfLines={1}>{units[2].name}</Text>
                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]} numberOfLines={2}>{units[2].desc}</Text>
              </BouncyPressable>

              <BouncyPressable
                style={[styles.weatherCard, { backgroundColor: units[3].bg, borderColor: units[3].color + '40' }]}
                onPress={() => router.push('/(command)/units')}
              >
                <View style={styles.weatherCardHeader}>
                  <Ionicons name={units[3].icon as any} size={22} color={units[3].color} />
                  <Text style={[styles.weatherState, { color: units[3].color }]} numberOfLines={1}>{units[3].state}</Text>
                </View>
                <Text style={[styles.weatherUnitName, { color: colors.text }]} numberOfLines={1}>{units[3].name}</Text>
                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]} numberOfLines={2}>{units[3].desc}</Text>
              </BouncyPressable>
            </View>
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
              <Text style={[styles.outcomeUnit, { color: colors.text }]} numberOfLines={1}>
                Training Wing: Shift Adjustment
              </Text>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : colors.successBg }]}>
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

  grid: { gap: Spacing.three },
  gridRow: { flexDirection: 'row', gap: Spacing.three },
  weatherCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: 1, minHeight: 110, justifyContent: 'space-between' },
  weatherCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  weatherState: { fontSize: 11, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  weatherUnitName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  weatherDesc: { fontSize: 11, lineHeight: 15 },

  trendList: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  trendLabel: { fontSize: 14, fontWeight: '600' },
  trendValueBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  trendValue: { fontSize: 13, fontWeight: '800' },

  outcomeCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, marginTop: Spacing.two },
  outcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.two },
  outcomeUnit: { fontSize: 14, fontWeight: '700', flex: 1, minWidth: 150 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  outcomeDesc: { fontSize: 13, lineHeight: 18 }
});
