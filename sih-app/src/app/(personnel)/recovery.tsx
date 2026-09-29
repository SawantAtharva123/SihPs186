import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { BarChart } from 'react-native-gifted-charts';
import { analyzeRecovery, getRecommendations } from '@/services/analyticsClient';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function RecoveryScreen() {
  const { colors, isDark } = useTheme();
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
    { value: 5, label: 'Mon', frontColor: colors.stateStable },
    { value: 8, label: 'Tue', frontColor: colors.stateEmerging },
    { value: 12, label: 'Wed', frontColor: colors.stateSustained },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recovery Engine</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Algorithmic rest recommendations & recovery debt half-life
        </Text>
      </FadeInView>

      {/* Recovery Debt Chart */}
      <FadeInView delay={100}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="battery-charging" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>RECOVERY DEBT (ML MODEL)</Text>
          </View>
          <View style={{ marginBottom: 20 }}>
            <BarChart
              data={barData}
              barWidth={32}
              spacing={40}
              roundedTop
              roundedBottom
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}
              noOfSections={3}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={[styles.mlBox, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border }]}>
              <View style={styles.mlBoxHeader}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={[styles.mlResultTitle, { color: colors.text }]}>ML Recovery Estimates</Text>
              </View>
              {recoveryData?.recovery_debt !== undefined && (
                <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Current Debt: <Text style={{ color: colors.text, fontWeight: '700' }}>{recoveryData.recovery_debt}</Text></Text>
              )}
              {recoveryData?.estimated_half_life !== undefined && (
                <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Estimated Half-Life: <Text style={{ color: colors.text, fontWeight: '700' }}>{recoveryData.estimated_half_life} Days</Text></Text>
              )}
              {recoveryData?.trajectory !== undefined && (
                <Text style={[styles.mlResultText, { color: colors.textSecondary }]}>Trajectory: <Text style={{ color: colors.text, fontWeight: '700' }}>{recoveryData.trajectory}</Text></Text>
              )}
            </View>
          )}
        </View>
      </FadeInView>

      {/* Recommendations */}
      <FadeInView delay={150}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb" size={18} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>RECOMMENDED INTERVENTIONS</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : recommendations?.recommendations?.length > 0 ? (
            recommendations.recommendations.map((rec: any, idx: number) => {
              const title =
                rec.title ||
                rec.potential ||
                (typeof rec === 'string' ? rec : 'Suggestion');
              const desc =
                rec.description ||
                rec.why ||
                (rec.observed
                  ? `${rec.observed} ${rec.why || ''}`.trim()
                  : typeof rec === 'string'
                  ? ''
                  : '');

              return (
                <BouncyPressable
                  key={idx}
                  style={[
                    styles.recItem,
                    {
                      backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.recIconCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(74, 144, 226, 0.15)'
                          : colors.primaryLight,
                      },
                    ]}
                  >
                    <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.recContent}>
                    <Text style={[styles.recTitle, { color: colors.text }]}>{title}</Text>
                    {desc ? (
                      <Text style={[styles.recDesc, { color: colors.textSecondary }]}>{desc}</Text>
                    ) : null}
                    {rec.evidence && (
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                        Basis: {rec.evidence} {rec.confidence ? `· Confidence: ${rec.confidence}` : ''}
                      </Text>
                    )}
                  </View>
                </BouncyPressable>
              );
            })
          ) : (
            <BouncyPressable style={[styles.recItem, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border }]}>
              <View style={[styles.recIconCircle, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
                <Ionicons name="moon-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.recContent}>
                <Text style={[styles.recTitle, { color: colors.text }]}>Restful Sleep</Text>
                <Text style={[styles.recDesc, { color: colors.textSecondary }]}>Prioritize 8+ hours of uninterrupted sleep for 2 days to clear current recovery debt.</Text>
              </View>
            </BouncyPressable>
          )}
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 100 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2, marginBottom: Spacing.four },
  
  card: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginBottom: Spacing.six,
    borderWidth: 1,
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

  mlBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  mlBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  mlResultTitle: {
    fontWeight: '800',
    fontSize: 14,
  },
  mlResultText: {
    marginBottom: 4,
    fontSize: 13,
  },

  recItem: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    marginBottom: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
  },
  recIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: { flex: 1 },
  recTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  recDesc: { fontSize: 12, lineHeight: 17 },
});
