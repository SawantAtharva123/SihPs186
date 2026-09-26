import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { predictStressAssessment, StressAssessmentResult } from '@/services/analyticsClient';
import { useTheme } from '@/context/ThemeContext';

interface DemoPersonnel {
  id: string;
  name: string;
  rank: string;
  unit: string;
  doctorReports: {
    consultations_count: number;
    sick_leave_days: number;
    doctor_stress_indicator: string;
    recommended_rest_days: number;
    clinical_notes: string;
  };
  miniGames: {
    avg_reaction_time_ms: number;
    reaction_time_std_ms: number;
    accuracy: number;
    missed_targets: number;
  };
  selfAssessment: {
    sleep_hours: number;
    energy_level: number;
    mood_level: number;
    self_reported_stress: string;
    workload_compared: string;
  };
  operationalContext: {
    duty_hours_per_week: number;
    night_shifts_per_month: number;
  };
}

const PERSONNEL_DATA: DemoPersonnel[] = [
  {
    id: 'CAPF-104',
    name: 'Rohan Verma',
    rank: 'Head Constable',
    unit: 'Alpha Coy / 402 Bn',
    doctorReports: {
      consultations_count: 3,
      sick_leave_days: 6,
      doctor_stress_indicator: 'High',
      recommended_rest_days: 3,
      clinical_notes: 'Exhaustion & circadian rhythm disorder from continuous border patrol. Advised rest rotation.',
    },
    miniGames: {
      avg_reaction_time_ms: 545,
      reaction_time_std_ms: 64,
      accuracy: 0.78,
      missed_targets: 4,
    },
    selfAssessment: {
      sleep_hours: 4.5,
      energy_level: 3.5,
      mood_level: 4.0,
      self_reported_stress: 'High',
      workload_compared: 'Higher',
    },
    operationalContext: {
      duty_hours_per_week: 62,
      night_shifts_per_month: 11,
    },
  },
  {
    id: 'CAPF-087',
    name: 'Amit Singh',
    rank: 'Constable',
    unit: 'Bravo Coy / 402 Bn',
    doctorReports: {
      consultations_count: 1,
      sick_leave_days: 1,
      doctor_stress_indicator: 'Moderate',
      recommended_rest_days: 1,
      clinical_notes: 'Mild fatigue reported after convoy deployment. Recovery sleep recommended.',
    },
    miniGames: {
      avg_reaction_time_ms: 480,
      reaction_time_std_ms: 44,
      accuracy: 0.87,
      missed_targets: 1,
    },
    selfAssessment: {
      sleep_hours: 6.0,
      energy_level: 6.0,
      mood_level: 6.0,
      self_reported_stress: 'Medium',
      workload_compared: 'Usual',
    },
    operationalContext: {
      duty_hours_per_week: 52,
      night_shifts_per_month: 6,
    },
  },
  {
    id: 'CAPF-231',
    name: 'Priya Sharma',
    rank: 'Sub-Inspector',
    unit: 'Signals Wing / HQ',
    doctorReports: {
      consultations_count: 2,
      sick_leave_days: 3,
      doctor_stress_indicator: 'High',
      recommended_rest_days: 2,
      clinical_notes: 'Stress signs noted clinically, though self-report minimized symptoms (masking pattern).',
    },
    miniGames: {
      avg_reaction_time_ms: 535,
      reaction_time_std_ms: 61,
      accuracy: 0.81,
      missed_targets: 3,
    },
    selfAssessment: {
      sleep_hours: 5.0,
      energy_level: 6.5,
      mood_level: 6.5,
      self_reported_stress: 'Low', // Masking!
      workload_compared: 'Usual',
    },
    operationalContext: {
      duty_hours_per_week: 58,
      night_shifts_per_month: 9,
    },
  },
  {
    id: 'CAPF-312',
    name: 'Rajesh Kumar',
    rank: 'Head Constable',
    unit: 'Delta Coy / 402 Bn',
    doctorReports: {
      consultations_count: 0,
      sick_leave_days: 0,
      doctor_stress_indicator: 'Normal',
      recommended_rest_days: 0,
      clinical_notes: 'Annual fitness check cleared without limitations.',
    },
    miniGames: {
      avg_reaction_time_ms: 415,
      reaction_time_std_ms: 32,
      accuracy: 0.94,
      missed_targets: 0,
    },
    selfAssessment: {
      sleep_hours: 7.5,
      energy_level: 8.0,
      mood_level: 8.0,
      self_reported_stress: 'Low',
      workload_compared: 'Usual',
    },
    operationalContext: {
      duty_hours_per_week: 46,
      night_shifts_per_month: 3,
    },
  },
];

export default function WelfarePersonnelScreen() {
  const { colors, isDark } = useTheme();
  const [selectedPerson, setSelectedPerson] = useState<DemoPersonnel | null>(null);
  const [assessment, setAssessment] = useState<StressAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const handleSelectPerson = async (person: DemoPersonnel) => {
    setSelectedPerson(person);
    setLoading(true);
    try {
      const res = await predictStressAssessment({
        personId: person.id,
        doctorReports: person.doctorReports,
        miniGames: person.miniGames,
        selfAssessment: person.selfAssessment,
        operationalContext: person.operationalContext,
      });
      setAssessment(res.data);
    } catch (err) {
      console.warn('Welfare assessment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Critical': return { color: colors.stateSustained, bg: isDark ? '#4C0519' : '#FFF1F2' };
      case 'High': return { color: colors.warning, bg: isDark ? '#451A03' : '#FFF8E6' };
      case 'Medium': return { color: colors.stateEmerging, bg: isDark ? '#082F49' : colors.stateEmergingBg };
      default: return { color: colors.stateStable, bg: isDark ? '#064E3B' : '#EBF9F1' };
    }
  };

  const filtered = PERSONNEL_DATA.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>Personnel Welfare Triangulation</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Real-time AI assessment with Zero-Undercounting Safety Bias
        </Text>

        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.backgroundSelected : Colors.light.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Search by name or CAPF ID..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {['All', 'Critical Priority', 'Elevated Stress', 'Signal Divergence'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                filter === f && { color: '#FFFFFF', fontWeight: '700' }
              ]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list}>
        {filtered.map((p) => {
          const isHigh = p.doctorReports.sick_leave_days >= 3 || p.selfAssessment.sleep_hours < 5.5;
          const statusLevel = isHigh ? (p.doctorReports.sick_leave_days >= 5 ? 'Critical' : 'High') : 'Stable';
          const theme = getLevelColor(statusLevel);

          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.personCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelectPerson(p)}
            >
              <View style={styles.personHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personName, { color: colors.text }]}>{p.name}</Text>
                  <Text style={[styles.personId, { color: colors.textSecondary }]}>
                    {p.rank} · {p.id} · {p.unit}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.badgeText, { color: theme.color }]}>{statusLevel}</Text>
                </View>
              </View>

              {/* Snapshot of Signals */}
              <View style={[styles.snapshotRow, { borderColor: colors.borderSubtle }]}>
                <View style={styles.snapItem}>
                  <Ionicons name="medical" size={13} color={colors.primary} />
                  <Text style={[styles.snapText, { color: colors.textSecondary }]}>
                    {p.doctorReports.consultations_count} consult(s)
                  </Text>
                </View>
                <View style={styles.snapItem}>
                  <Ionicons name="flash" size={13} color={colors.warning} />
                  <Text style={[styles.snapText, { color: colors.textSecondary }]}>{p.miniGames.avg_reaction_time_ms}ms RT</Text>
                </View>
                <View style={styles.snapItem}>
                  <Ionicons name="moon" size={13} color={colors.accent} />
                  <Text style={[styles.snapText, { color: colors.textSecondary }]}>{p.selfAssessment.sleep_hours}h sleep</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── DETAIL MODAL: MULTI-MODAL ML STRESS EVALUATION ─────────── */}
      <Modal visible={!!selectedPerson} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedPerson(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>{selectedPerson?.name}</Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                {selectedPerson?.rank} · {selectedPerson?.id}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPerson(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 13 }}>
                  Executing Multi-Modal Asymmetric Inference...
                </Text>
              </View>
            ) : (
              <>
                {/* Overall Stress Result */}
                <View
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: getLevelColor(assessment?.stress_level).bg,
                      borderColor: getLevelColor(assessment?.stress_level).color,
                    },
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultLabel, { color: isDark ? '#94A3B8' : colors.textSecondary }]}>AI EVALUATED STRESS RISK</Text>
                    <Text
                      style={[
                        styles.resultScore,
                        { color: getLevelColor(assessment?.stress_level).color },
                      ]}
                    >
                      {assessment?.stress_score.toFixed(0)} / 100
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.resultLevel,
                      { color: getLevelColor(assessment?.stress_level).color },
                    ]}
                  >
                    {assessment?.stress_level} Stress Level
                  </Text>

                  {/* Safety Guarantee Callout */}
                  <View style={[styles.safetyBox, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5', borderColor: isDark ? '#05966966' : '#A7F3D0' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    <Text style={[styles.safetyText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                      Zero-Undercounting Bias Active: Bayes loss matrix penalizes false negatives up to 22× to prevent missing personnel in need.
                    </Text>
                  </View>
                </View>

                {/* Triangulation Modalities */}
                <Text style={[styles.sectionHeader, { color: isDark ? '#F8FAFC' : colors.navy }]}>SIGNAL TRIANGULATION BREAKDOWN</Text>

                {/* 1. Doctor Reports */}
                <View style={[styles.modalityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalityHeader}>
                    <Ionicons name="medical" size={18} color={colors.primary} />
                    <Text style={[styles.modalityTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>1. Doctor & Medical Reports</Text>
                    <Text style={[styles.modalityState, { color: colors.primary }]}>
                      {assessment?.subscores?.doctor_reports?.clinical_indicator}
                    </Text>
                  </View>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Consultations: {assessment?.subscores?.doctor_reports?.consultations} logged
                  </Text>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Recommended Rest: {selectedPerson?.doctorReports.recommended_rest_days} days
                  </Text>
                  <Text style={[styles.modalityNotes, { color: colors.textMuted, borderTopColor: colors.borderSubtle }]}>
                    Clinical Notes: "{selectedPerson?.doctorReports.clinical_notes}"
                  </Text>
                </View>

                {/* 2. Mini-Games Performance */}
                <View style={[styles.modalityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalityHeader}>
                    <Ionicons name="flash" size={18} color={colors.warning} />
                    <Text style={[styles.modalityTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>2. Mini-Games Cognitive Reaction</Text>
                    <Text style={[styles.modalityState, { color: colors.warning }]}>
                      {assessment?.subscores?.mini_games?.state}
                    </Text>
                  </View>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Average Reaction Time: {assessment?.subscores?.mini_games?.avg_reaction_time_ms} ms
                  </Text>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Reaction Variability: ±{assessment?.subscores?.mini_games?.reaction_variability_ms} ms
                  </Text>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Target Accuracy: {assessment?.subscores?.mini_games?.accuracy_pct}%
                  </Text>
                </View>

                {/* 3. Self-Assessment */}
                <View style={[styles.modalityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalityHeader}>
                    <Ionicons name="moon" size={18} color={colors.accent} />
                    <Text style={[styles.modalityTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>3. Self-Assessment Check-in</Text>
                    <Text style={[styles.modalityState, { color: colors.accent }]}>
                      {assessment?.subscores?.self_assessment?.state}
                    </Text>
                  </View>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Recorded Sleep Duration: {assessment?.subscores?.self_assessment?.sleep_hours.toFixed(1)} hours
                  </Text>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Subjective Stress: {selectedPerson?.selfAssessment.self_reported_stress}
                  </Text>
                  <Text style={[styles.modalityText, { color: colors.textSecondary }]}>
                    • Workload Comparison: {selectedPerson?.selfAssessment.workload_compared}
                  </Text>
                </View>

                {/* Signal Agreement / Disagreement Analysis */}
                <View style={[styles.agreementCard, { backgroundColor: isDark ? '#064E3B33' : '#F0FDF4', borderColor: isDark ? '#05966955' : '#BBF7D0' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="git-network" size={16} color={colors.primary} />
                    <Text style={[styles.agreementTitle, { color: colors.primary }]}>
                      Signal Agreement: {assessment?.signal_agreement?.level}
                    </Text>
                  </View>
                  {assessment?.signal_agreement?.divergence_note ? (
                    <Text style={[styles.agreementDesc, { color: colors.text }]}>
                      {assessment?.signal_agreement?.divergence_note}
                    </Text>
                  ) : (
                    <Text style={[styles.agreementDesc, { color: colors.text }]}>
                      All three signal sources (doctor records, cognitive test reaction times, and self-reported sleep) converge consistently.
                    </Text>
                  )}
                </View>

                {/* Welfare Officer Recommendations */}
                <Text style={[styles.sectionHeader, { color: isDark ? '#F8FAFC' : colors.navy }]}>RECOMMENDED INTERVENTIONS</Text>
                {assessment?.recommendations?.map((rec, i) => (
                  <View key={i} style={[styles.recItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recType, { color: isDark ? '#F8FAFC' : colors.navy }]}>
                        {rec.type} ({rec.urgency})
                      </Text>
                      <Text style={[styles.recAction, { color: colors.textSecondary }]}>{rec.action}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.navy },
  headerSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2, marginBottom: Spacing.three },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: { marginLeft: Spacing.two, flex: 1, fontSize: 14, color: Colors.light.text },
  filtersRow: { flexDirection: 'row', gap: Spacing.two },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: Colors.light.navy, borderColor: Colors.light.navy },
  filterText: { color: Colors.light.textSecondary, fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: Spacing.four },
  personCard: {
    backgroundColor: '#fff',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.three,
  },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personName: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 2 },
  personId: { color: Colors.light.textSecondary, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  snapshotRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  snapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snapText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  modalContainer: { flex: 1, backgroundColor: Colors.light.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.navy },
  modalSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  modalBody: { padding: Spacing.four, paddingBottom: Spacing.ten },
  resultCard: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1.5,
    marginBottom: Spacing.four,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: Colors.light.textSecondary,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  resultLevel: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: Spacing.two,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.navy,
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  modalityCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.three,
  },
  modalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  modalityTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  modalityState: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  modalityText: {
    fontSize: 12,
    color: Colors.light.text,
    marginBottom: 3,
  },
  modalityNotes: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: 4,
  },
  agreementCard: {
    backgroundColor: '#F0FDF4',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.four,
  },
  agreementTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  agreementDesc: {
    fontSize: 11,
    color: Colors.light.text,
    lineHeight: 16,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.two,
  },
  recType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  recAction: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
