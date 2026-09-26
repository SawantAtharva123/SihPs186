import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { LineChart } from 'react-native-gifted-charts';
import { analyzeBaseline } from '@/services/analyticsClient';
import { useTrends } from '@/hooks/useTrends';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function TrendsScreen() {
  const { currentUser } = useSahayak();
  const { colors, isDark } = useTheme();
  const personId = currentUser?.id ?? 'person-001';

  const { sleepTrend, recoveryTrend, dutyTrend, reactionTrend, loading, loadTrends } = useTrends();
  const [baselineData, setBaselineData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sleep' | 'reaction' | 'recovery'>('sleep');

  useFocusEffect(
    useCallback(() => {
      loadTrends(14);
    }, [loadTrends])
  );

  useEffect(() => {
    if (sleepTrend.length > 0) {
      analyzeBaseline(personId, 'sleep', sleepTrend.slice(-14))
        .then((res) => setBaselineData(res.data))
        .catch((err) => console.warn('Baseline analysis error:', err));
    }
  }, [personId, sleepTrend]);

  // Format data for Gifted Charts
  const getActiveChartData = () => {
    let source = sleepTrend;
    if (selectedMetric === 'reaction') source = reactionTrend;
    if (selectedMetric === 'recovery') source = recoveryTrend;

    if (!source || source.length === 0) {
      if (selectedMetric === 'reaction') {
        return [
          { value: 430, label: 'D1', dataPointText: '430' },
          { value: 450, label: 'D2', dataPointText: '450' },
          { value: 420, label: 'D3', dataPointText: '420' },
          { value: 480, label: 'D4', dataPointText: '480' },
          { value: 440, label: 'D5', dataPointText: '440' },
          { value: 460, label: 'D6', dataPointText: '460' },
          { value: 435, label: 'D7', dataPointText: '435' },
        ];
      }
      if (selectedMetric === 'recovery') {
        return [
          { value: 75, label: 'D1', dataPointText: '75' },
          { value: 70, label: 'D2', dataPointText: '70' },
          { value: 65, label: 'D3', dataPointText: '65' },
          { value: 80, label: 'D4', dataPointText: '80' },
          { value: 72, label: 'D5', dataPointText: '72' },
          { value: 68, label: 'D6', dataPointText: '68' },
          { value: 74, label: 'D7', dataPointText: '74' },
        ];
      }
      return [
        { value: 7.2, label: 'D1', dataPointText: '7.2' },
        { value: 6.8, label: 'D2', dataPointText: '6.8' },
        { value: 7.0, label: 'D3', dataPointText: '7.0' },
        { value: 5.5, label: 'D4', dataPointText: '5.5' },
        { value: 6.0, label: 'D5', dataPointText: '6.0' },
        { value: 7.5, label: 'D6', dataPointText: '7.5' },
        { value: 7.2, label: 'D7', dataPointText: '7.2' },
      ];
    }

    if (source.length === 1) {
      const single = source[0];
      const val = Math.round((single.value || 0) * 10) / 10;
      return [
        { value: val, label: 'Prior', dataPointText: val.toString() },
        { value: val, label: 'Today', dataPointText: val.toString() },
      ];
    }

    const lastPoints = source.slice(-10);
    return lastPoints.map((s, idx) => {
      const parts = (s.date || '').split('T')[0].split('-');
      const label = parts[2] ? parts[2] : `D${idx + 1}`;
      const val = Math.round((s.value || 0) * 10) / 10;
      return {
        value: val,
        label,
        dataPointText: val.toString(),
      };
    });
  };

  const chartData = getActiveChartData();
  const activeColor =
    selectedMetric === 'reaction'
      ? colors.warning
      : selectedMetric === 'recovery'
      ? colors.success
      : colors.primary;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Longitudinal Trends & Baselines</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Learning your individual operating baseline over time
        </Text>
      </FadeInView>

      {/* Metric Selector Tabs */}
      <FadeInView delay={100}>
        <View style={styles.tabsContainer}>
          <BouncyPressable
            style={[
              styles.tabBtn,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              selectedMetric === 'sleep' && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight },
            ]}
            onPress={() => setSelectedMetric('sleep')}
          >
            <Ionicons
              name="moon"
              size={16}
              color={selectedMetric === 'sleep' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                selectedMetric === 'sleep' && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              Sleep (Hours)
            </Text>
          </BouncyPressable>

          <BouncyPressable
            style={[
              styles.tabBtn,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              selectedMetric === 'reaction' && { borderColor: colors.warning, backgroundColor: isDark ? 'rgba(230, 126, 34, 0.15)' : '#FFF8E6' },
            ]}
            onPress={() => setSelectedMetric('reaction')}
          >
            <Ionicons
              name="flash"
              size={16}
              color={selectedMetric === 'reaction' ? colors.warning : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                selectedMetric === 'reaction' && { color: colors.warning, fontWeight: '700' },
              ]}
            >
              Reaction (ms)
            </Text>
          </BouncyPressable>

          <BouncyPressable
            style={[
              styles.tabBtn,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              selectedMetric === 'recovery' && { borderColor: colors.success, backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#EBF9F1' },
            ]}
            onPress={() => setSelectedMetric('recovery')}
          >
            <Ionicons
              name="battery-charging"
              size={16}
              color={selectedMetric === 'recovery' ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                selectedMetric === 'recovery' && { color: colors.success, fontWeight: '700' },
              ]}
            >
              Recovery
            </Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      {/* Chart Card */}
      <FadeInView delay={150}>
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {selectedMetric === 'sleep'
                ? 'SLEEP DURATION (HOURS) VS PERSONAL BASELINE'
                : selectedMetric === 'reaction'
                ? 'COGNITIVE REACTION TIME (MS)'
                : 'RECOVERY CAPACITY TRAJECTORY'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <>
              <View style={{ marginBottom: 15, paddingRight: 10 }}>
                <LineChart
                  data={chartData}
                  height={180}
                  spacing={32}
                  initialSpacing={15}
                  color={activeColor}
                  thickness={3}
                  dataPointsColor={activeColor}
                  dataPointsRadius={4}
                  noOfSections={4}
                  yAxisColor={colors.border}
                  yAxisThickness={1}
                  rulesType="solid"
                  rulesColor={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  xAxisColor={colors.border}
                  showValuesAsDataPointsText
                  textColor={colors.text}
                  textFontSize={10}
                />
              </View>

              {/* ML Baseline Stats */}
              {selectedMetric === 'sleep' && baselineData && (
                <View style={[styles.mlResultsBox, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.mlHeader}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                    <Text style={[styles.mlResultTitle, { color: colors.text }]}>ML Robust Baseline (Median + MAD + EWMA)</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Median Normal</Text>
                      <Text style={[styles.statVal, { color: colors.text }]}>{baselineData.median?.toFixed(1) ?? '7.2'} hrs</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>MAD Dispersion</Text>
                      <Text style={[styles.statVal, { color: colors.text }]}>±{baselineData.mad?.toFixed(1) ?? '0.8'}h</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EWMA Trend</Text>
                      <Text style={[styles.statVal, { color: colors.text }]}>{baselineData.ewma?.toFixed(1) ?? '6.9'} hrs</Text>
                    </View>
                  </View>
                  <Text style={[styles.mlNote, { color: colors.textSecondary, borderTopColor: colors.border }]}>
                    Deviation threshold: Values &lt; {(baselineData.median - 1.5 * baselineData.mad)?.toFixed(1) ?? '5.5'}h flag an acute sleep recovery deficit.
                  </Text>
                </View>
              )}

              {selectedMetric === 'reaction' && (
                <View style={[styles.mlResultsBox, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.mlHeader}>
                    <Ionicons name="flash" size={16} color={colors.warning} />
                    <Text style={[styles.mlResultTitle, { color: colors.text }]}>Functional Micro-Task Signal</Text>
                  </View>
                  <Text style={[styles.mlNote, { color: colors.textSecondary, borderTopColor: colors.border }]}>
                    Tracks motor speed and inhibitory lapses from voluntary cognitive mini-games. Persistent reaction lags &gt; 520ms correlate with operational fatigue and sleep deficits.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: Spacing.four,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mlResultsBox: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginTop: Spacing.two,
    borderWidth: 1,
  },
  mlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  mlResultTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  mlNote: {
    fontSize: 11,
    lineHeight: 16,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
});
