import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import DailyCheckInModal from '@/components/DailyCheckInModal';
import DoctorReportModal from '@/components/DoctorReportModal';
import SupportRequestModal from '@/components/SupportRequestModal';
import { useStressAssessment } from '@/hooks/useStressAssessment';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';
import FadeInView from '@/components/animations/FadeInView';
import BouncyPressable from '@/components/animations/BouncyPressable';
import PulseView from '@/components/animations/PulseView';

export default function PersonnelHomeScreen() {
  const router = useRouter();
  const { currentUser, isOffline, mlStatus } = useSahayak();
  const { colors, isDark } = useTheme();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const {
    assessment,
    autoConsultation,
    loading,
    confidence,
    isStale,
    refresh,
  } = useStressAssessment();

  // Live refresh whenever screen gains focus (e.g. returning from games or check-ins)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const stressLevel = assessment?.stress_level ?? 'Medium';
  const stressScore = assessment?.stress_score ?? 45.0;

  const getLevelTheme = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          color: colors.stateSustained,
          bg: isDark ? '#3E0A16' : colors.stateSustainedBg,
          border: isDark ? '#9F1239' : '#FECACA',
          icon: 'alert-circle',
          desc: 'High cumulative load and acute fatigue detected across multiple signal families. Conservative welfare safety active.',
        };
      case 'High':
        return {
          color: colors.warning,
          bg: isDark ? '#371B04' : '#FFF8E6',
          border: isDark ? '#B45309' : '#FDE68A',
          icon: 'warning',
          desc: 'Elevated stress response detected. Rest rotation and sleep recovery recommended to prevent chronic exhaustion.',
        };
      case 'Medium':
        return {
          color: colors.stateEmerging,
          bg: isDark ? '#082F49' : colors.stateEmergingBg,
          border: isDark ? '#0284C7' : '#BAE6FD',
          icon: 'analytics',
          desc: 'Moderate routine strain within manageable limits. Baseline consistency is maintained.',
        };
      default:
        return {
          color: colors.success,
          bg: isDark ? '#064E3B' : '#EBF9F1',
          border: isDark ? '#059669' : '#A7F3D0',
          icon: 'checkmark-circle',
          desc: 'Balanced physiological, cognitive, and self-reported wellness state.',
        };
    }
  };

  const theme = getLevelTheme(stressLevel);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      {/* Greeting Section */}
      <FadeInView delay={0} style={styles.greetingSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.greetingTitle, { color: isDark ? '#FFFFFF' : colors.navy }]}>
              GOOD MORNING, {currentUser?.name?.split(' ')[0] ?? 'Rohan'}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
              Integrated Welfare & Stress Intelligence
            </Text>
          </View>
          {mlStatus === 'live' && (
            <View style={[styles.offlineBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0' }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
              <Text style={[styles.offlineText, { color: '#10B981' }]}>ML Live</Text>
            </View>
          )}
          {mlStatus === 'offline' && (
            <View style={[styles.offlineBadge, { backgroundColor: isDark ? '#451A03' : '#FFFBEB', borderColor: isDark ? '#78350F' : '#FDE68A' }]}>
              <Ionicons name="cloud-offline" size={13} color={colors.warning} />
              <Text style={[styles.offlineText, { color: colors.warning }]}>Offline</Text>
            </View>
          )}
          {mlStatus === 'disconnected' && !isOffline && (
            <View style={[styles.offlineBadge, { backgroundColor: isDark ? '#451A03' : '#FEF2F2', borderColor: isDark ? '#78350F' : '#FECACA' }]}>
              <Ionicons name="alert-circle" size={13} color="#EF4444" />
              <Text style={[styles.offlineText, { color: '#EF4444' }]}>Disconnected</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── 1-TAP ASSISTANCE: "I NEED SUPPORT" ACTION BANNER ─────── */}
      <FadeInView delay={30}>
        <BouncyPressable
          style={[styles.oneTapSupportBanner, { backgroundColor: '#DC2626' }]}
          onPress={() => setShowSupportModal(true)}
        >
          <View style={styles.oneTapSupportIconBox}>
            <Ionicons name="hand-left" size={24} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.oneTapTitleRow}>
              <Text style={styles.oneTapSupportTitle}>I Need Support</Text>
              <View style={styles.oneTapPillTag}>
                <Text style={styles.oneTapPillTagText}>1-TAP ASSISTANCE</Text>
              </View>
            </View>
            <Text style={styles.oneTapSupportSubtitle}>
              Officer callback, private meeting, workload or anonymous facility issue
            </Text>
          </View>
          <View style={styles.oneTapArrowCircle}>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </View>
        </BouncyPressable>
      </FadeInView>

      {/* ── REST ADVISORY & AUTO-BOOKED CONSULTATION BANNER ──────── */}
      {(stressLevel === 'Critical' || stressLevel === 'High' || assessment?.auto_consultation_required) && (
        <FadeInView delay={60}>
          <PulseView active={stressLevel === 'Critical'}>
            <View
              style={[
                styles.alertBanner,
                stressLevel === 'Critical'
                  ? { backgroundColor: isDark ? '#4C0519' : '#FEF2F2', borderColor: isDark ? '#BE123C' : '#FECACA' }
                  : { backgroundColor: isDark ? '#451A03' : '#FFFBEB', borderColor: isDark ? '#D97706' : '#FDE68A' },
              ]}
            >
              <View style={styles.alertBannerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons
                    name={stressLevel === 'Critical' ? 'alert-circle' : 'warning'}
                    size={22}
                    color={stressLevel === 'Critical' ? '#EF4444' : '#F59E0B'}
                  />
                  <Text
                    style={[
                      styles.alertBannerTitle,
                      { color: stressLevel === 'Critical' ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#FDE68A' : '#92400E') },
                    ]}
                  >
                    {stressLevel === 'Critical'
                      ? 'TACTICAL REST ADVISORY · CRITICAL LOAD'
                      : 'OPERATIONAL REST ADVISORY · ELEVATED STRESS'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.alertStandDownBadge,
                    { backgroundColor: stressLevel === 'Critical' ? (isDark ? '#881337' : '#FEE2E2') : (isDark ? '#78350F' : '#FEF3C7') },
                  ]}
                >
                  <Text
                    style={[
                      styles.alertStandDownText,
                      { color: stressLevel === 'Critical' ? (isDark ? '#FECDD3' : '#B91C1C') : (isDark ? '#FEF3C7' : '#B45309') },
                    ]}
                  >
                    {stressLevel === 'Critical' ? 'MANDATORY STAND-DOWN' : 'REST ADVISED'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.alertBannerMessage, { color: isDark ? '#E2E8F0' : colors.text }]}>
                {stressLevel === 'Critical'
                  ? 'Acute psychomotor slowing or severe cumulative fatigue detected. Immediate stand-down from tactical and arms duty advised. Mandatory 24-48h restorative rotation.'
                  : 'Elevated cognitive latency or physical strain detected. Operational rest rotation recommended to prevent severe exhaustion.'}
              </Text>

              {/* Consultation auto-booked pill */}
              <View style={[styles.alertConsultationBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
                <View style={styles.alertConsultationRow}>
                  <Ionicons name="medkit" size={16} color={stressLevel === 'Critical' ? '#EF4444' : '#F59E0B'} />
                  <Text style={[styles.alertConsultationTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>
                    MI Room Consultation Auto-Booked
                  </Text>
                </View>
                <Text style={[styles.alertConsultationDetail, { color: colors.textSecondary }]}>
                  Assigned: Capt. S. Nair, AMC (Duty Medical Officer) · Unit MI Room
                </Text>
                {autoConsultation && (
                  <Text style={[styles.alertConsultationId, { color: colors.textMuted }]}>
                    Ref ID: {autoConsultation.id.slice(0, 10).toUpperCase()} · Status: Pending Officer Clearance
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.alertConsultationBtn, { backgroundColor: isDark ? '#0F2942' : '#EFF6FF', borderColor: isDark ? '#1E40AF' : '#BFDBFE' }]}
                  onPress={() => setShowConsultationModal(true)}
                >
                  <Text style={[styles.alertConsultationBtnText, { color: colors.primary }]}>
                    View Appointment Details & Triggers →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </PulseView>
        </FadeInView>
      )}

      {/* ── LIVE MULTI-MODAL STRESS ASSESSMENT CARD ────────────────── */}
      <FadeInView delay={120}>
        <View style={[styles.stateCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={styles.stateHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name={theme.icon as any} size={20} color={theme.color} />
              <Text style={[styles.stateLabel, { color: theme.color }]}>
                MULTI-MODAL STRESS LEVEL
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
              <Text style={[styles.scoreText, { color: theme.color }]}>{stressScore.toFixed(0)}/100</Text>
            </View>
          </View>

          <Text style={[styles.stateMainText, { color: theme.color }]}>
            {stressLevel} Stress Risk
          </Text>

          {/* Confidence & Asymmetric Safety Pill */}
          <View style={styles.badgeRow}>
            <View style={[styles.confidenceRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF' }]}>
              <Ionicons name="information-circle" size={13} color={colors.textSecondary} />
              <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                Confidence: {Math.round(confidence * 100)}%
              </Text>
            </View>
            <View style={[styles.safetyPill, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={[styles.safetyPillText, { color: '#10B981' }]}>Asymmetric Loss · Zero-Undercounting Bias</Text>
            </View>
          </View>

          <Text style={[styles.stateDescription, { color: isDark ? '#CBD5E1' : Colors.light.text }]}>{theme.desc}</Text>

          {/* Multi-Modal Sub-Signals Breakdown */}
          <View style={[styles.subsignalsContainer, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
            <Text style={[styles.subsignalHeader, { color: isDark ? '#94A3B8' : colors.textSecondary }]}>INPUT SIGNAL TRIANGULATION</Text>
            
            <View style={styles.signalGrid}>
              {/* 1. Doctor Reports */}
              <View style={[styles.signalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : colors.border }]}>
                <View style={styles.signalCardHeader}>
                  <Ionicons name="medkit" size={13} color={colors.primary} />
                  <Text style={[styles.signalTitle, { color: isDark ? '#94A3B8' : colors.textSecondary }]} numberOfLines={1}>Doctor</Text>
                </View>
                <Text style={[styles.signalValue, { color: isDark ? '#F8FAFC' : colors.navy }]} numberOfLines={1}>
                  {assessment?.subscores?.doctor_reports?.clinical_indicator ?? 'Normal'}
                </Text>
                <Text style={[styles.signalSub, { color: isDark ? '#64748B' : colors.textMuted }]} numberOfLines={2}>
                  {assessment?.subscores?.doctor_reports?.consultations ?? 0} consult · {assessment?.subscores?.doctor_reports?.sick_leave_days ?? 0}d lv
                </Text>
              </View>

              {/* 2. Mini-Games Reaction Timing */}
              <View style={[styles.signalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : colors.border }]}>
                <View style={styles.signalCardHeader}>
                  <Ionicons name="flash" size={13} color={colors.warning} />
                  <Text style={[styles.signalTitle, { color: isDark ? '#94A3B8' : colors.textSecondary }]} numberOfLines={1}>Mini-Games</Text>
                </View>
                <Text style={[styles.signalValue, { color: isDark ? '#F8FAFC' : colors.navy }]} numberOfLines={1}>
                  {Math.round(assessment?.subscores?.mini_games?.avg_reaction_time_ms ?? 450)} ms
                </Text>
                <Text style={[styles.signalSub, { color: isDark ? '#64748B' : colors.textMuted }]} numberOfLines={2}>
                  ±{Math.round(assessment?.subscores?.mini_games?.reaction_variability_ms ?? 38)}ms · {(() => {
                    const rawAcc = assessment?.subscores?.mini_games?.accuracy_pct ?? 90;
                    return Math.round(rawAcc > 100 ? rawAcc / 100 : rawAcc);
                  })()}%
                </Text>
              </View>

              {/* 3. Sleep & Self-Assessment */}
              <View style={[styles.signalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : colors.border }]}>
                <View style={styles.signalCardHeader}>
                  <Ionicons name="moon" size={13} color={colors.accent} />
                  <Text style={[styles.signalTitle, { color: isDark ? '#94A3B8' : colors.textSecondary }]} numberOfLines={1}>Check-in</Text>
                </View>
                <Text style={[styles.signalValue, { color: isDark ? '#F8FAFC' : colors.navy }]} numberOfLines={1}>
                  {assessment?.subscores?.self_assessment?.sleep_hours?.toFixed(1) ?? '7.0'} hrs
                </Text>
                <Text style={[styles.signalSub, { color: isDark ? '#64748B' : colors.textMuted }]} numberOfLines={2}>
                  Sleep · {assessment?.subscores?.self_assessment?.state ?? 'Normal'}
                </Text>
              </View>
            </View>
          </View>

          {/* Signal Disagreement Warning if Active */}
          {assessment?.signal_agreement?.disagreement_detected && (
            <View style={[styles.divergenceCard, { backgroundColor: isDark ? '#082F49' : Colors.light.stateEmergingBg, borderColor: colors.stateEmerging }]}>
              <Ionicons name="git-branch" size={16} color={colors.stateEmerging} />
              <Text style={[styles.divergenceText, { color: isDark ? '#BAE6FD' : Colors.light.navy }]}>
                {assessment?.signal_agreement?.divergence_note}
              </Text>
            </View>
          )}

          {/* Somatic Symptoms Flagged (NLP Extraction) */}
          {assessment?.somatic_symptoms_flagged && assessment.somatic_symptoms_flagged.length > 0 && (
            <View style={[styles.somaticFlaggedBox, { backgroundColor: isDark ? '#2E1065' : '#FAF5FF', borderColor: isDark ? '#581C87' : '#E9D5FF' }]}>
              <View style={styles.somaticFlaggedHeaderRow}>
                <Ionicons name="sparkles" size={14} color="#A855F7" />
                <Text style={[styles.somaticFlaggedHeader, { color: isDark ? '#D8B4FE' : '#6B21A8' }]}>
                  SOMATIC SYMPTOMS DETECTED (NLP):
                </Text>
              </View>
              <View style={styles.somaticBadgeRow}>
                {assessment.somatic_symptoms_flagged.map((sym) => (
                  <View key={sym} style={[styles.somaticFlaggedBadge, { backgroundColor: isDark ? '#4C0519' : '#FEE2E2', borderColor: isDark ? '#9F1239' : '#FECACA' }]}>
                    <Ionicons name="pulse" size={12} color="#EF4444" />
                    <Text style={[styles.somaticFlaggedBadgeText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>{sym}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Active Safety Guardrail Triggers */}
          {assessment?.safety_guardrails?.safety_triggers && assessment.safety_guardrails.safety_triggers.length > 0 && (
            <View style={[styles.safetyTriggersBox, { backgroundColor: isDark ? '#4C0519' : '#FEF2F2', borderColor: isDark ? '#9F1239' : '#FECACA' }]}>
              <View style={styles.safetyTriggersHeaderRow}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={[styles.safetyTriggersHeader, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                  ACTIVE SAFETY GUARDRAIL TRIGGERS:
                </Text>
              </View>
              {assessment.safety_guardrails.safety_triggers.map((trig, idx) => (
                <Text key={idx} style={[styles.safetyTriggerItem, { color: isDark ? '#FECDD3' : '#7F1D1D' }]}>• {trig}</Text>
              ))}
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── DAILY CHECK-IN ACTION CARD ────────────────────────────── */}
      <FadeInView delay={180}>
        <BouncyPressable
          style={[styles.actionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, hasCheckedIn ? styles.actionCardDone : null]}
          onPress={() => setShowCheckIn(true)}
        >
          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#042F2E' : '#CCFBF1' }]}>
              <Ionicons
                name="clipboard"
                size={24}
                color={hasCheckedIn ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.actionCardTextContainer}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Daily Wellbeing Check-in</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                {hasCheckedIn
                  ? `Logged: ${assessment?.subscores?.self_assessment?.sleep_hours ?? 7.0} hours sleep`
                  : 'Log exact sleep hours, workload, energy & somatic notes (~30s)'}
              </Text>
            </View>
            <Ionicons
              name={hasCheckedIn ? 'checkmark-circle' : 'chevron-forward'}
              size={24}
              color={hasCheckedIn ? colors.success : colors.textMuted}
            />
          </View>
        </BouncyPressable>
      </FadeInView>

      {/* ── DOCTOR / MEDICAL REPORTS UPLOAD CARD ─────────────────── */}
      <FadeInView delay={240}>
        <BouncyPressable
          style={[styles.doctorActionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => setShowDoctorModal(true)}
        >
          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF' }]}>
              <Ionicons name="medical" size={24} color={colors.accent} />
            </View>
            <View style={styles.actionCardTextContainer}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Medical & Doctor Reports</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                Upload consultations or sick notes to update AI clinical safety
              </Text>
            </View>
            <View style={[styles.uploadBadge, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: isDark ? '#334155' : '#BFDBFE' }]}>
              <Ionicons name="cloud-upload" size={14} color={colors.primary} />
              <Text style={[styles.uploadBadgeText, { color: colors.primary }]}>Upload</Text>
            </View>
          </View>
        </BouncyPressable>
      </FadeInView>

      {/* ── TODAY'S MINI-GAMES / COGNITIVE ACTIVITIES ────────────── */}
      <FadeInView delay={300} style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three }}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COGNITIVE MICRO-TASKS</Text>
          <TouchableOpacity onPress={() => router.push('/(personnel)/activities')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>All Activities →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          <BouncyPressable
            style={[styles.activityItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(personnel)/activities')}
          >
            <View style={styles.activityItemLeft}>
              <View style={[styles.miniIconBg, { backgroundColor: isDark ? '#064E3B' : '#EBF9F1' }]}>
                <Ionicons name="flash" size={18} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.activityItemTitle, { color: colors.text }]}>Quick Tap</Text>
                <Text style={[styles.activityItemDesc, { color: colors.textSecondary }]}>Reaction timing & motor stability (~20s)</Text>
              </View>
            </View>
            <Text style={[styles.activityItemStatusSuccess, { color: colors.success }]}>Play & Test</Text>
          </BouncyPressable>

          <BouncyPressable
            style={[styles.activityItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(personnel)/activities')}
          >
            <View style={styles.activityItemLeft}>
              <View style={[styles.miniIconBg, { backgroundColor: isDark ? '#042F2E' : colors.primaryLight }]}>
                <Ionicons name="hand-right" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.activityItemTitle, { color: colors.text }]}>Go / No-Go</Text>
                <Text style={[styles.activityItemDesc, { color: colors.textSecondary }]}>Inhibitory control & attention (~30s)</Text>
              </View>
            </View>
            <Text style={[styles.activityItemStatusAction, { color: colors.primary }]}>Recommended</Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      {/* ── GRID OF PREVIEWS ──────────────────────────────────────── */}
      <FadeInView delay={360} style={styles.gridContainer}>
        {/* My Trends */}
        <BouncyPressable
          style={[styles.gridCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => router.push('/(personnel)/trends')}
        >
          <View style={styles.gridCardHeader}>
            <Ionicons name="trending-up" size={18} color={colors.accent} />
            <Text style={[styles.gridCardTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>MY TRENDS</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Sleep</Text>
            <Text style={[styles.trendVal, { color: colors.text }]}>{assessment?.subscores?.self_assessment?.sleep_hours ?? 7.0}h</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Reaction</Text>
            <Text style={[styles.trendVal, { color: colors.text }]}>{Math.round(assessment?.subscores?.mini_games?.avg_reaction_time_ms ?? 450)}ms</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>Stress Risk</Text>
            <Text style={[styles.trendVal, { color: theme.color, fontWeight: '700' }]}>{stressLevel}</Text>
          </View>
        </BouncyPressable>

        {/* Recovery */}
        <BouncyPressable
          style={[styles.gridCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => router.push('/(personnel)/recovery')}
        >
          <View style={styles.gridCardHeader}>
            <Ionicons name="battery-charging" size={18} color={colors.success} />
            <Text style={[styles.gridCardTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>RECOVERY</Text>
          </View>
          <Text style={[styles.gridValueMain, { color: isDark ? '#F8FAFC' : colors.navy }]}>
            {stressLevel === 'Low' ? 'Restored' : stressLevel === 'Medium' ? 'Moderate' : 'Debt Alert'}
          </Text>
          <Text style={[styles.gridValueSub, { color: colors.textSecondary }]}>
            Load Index: {stressScore.toFixed(0)} / 100
          </Text>
        </BouncyPressable>
      </FadeInView>

      {/* ── OPERATIONAL & SOVEREIGNTY SERVICES ────────────────────── */}
      <FadeInView delay={420} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          OPERATIONAL & WELFARE SERVICES
        </Text>
        
        <View style={styles.servicesGrid}>
          {/* Unit Pulse */}
          <BouncyPressable
            style={[styles.serviceCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(personnel)/pulse')}
          >
            <View style={[styles.serviceIconBg, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
              <Ionicons name="pulse" size={20} color={colors.stateEmerging} />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={[styles.serviceTitle, { color: colors.text }]}>Unit Pulse</Text>
              <Text style={[styles.serviceSubtitle, { color: colors.textSecondary }]}>
                Anonymous unit morale, workload index & volatility telemetry
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </BouncyPressable>

          {/* Confidential Support & Welfare */}
          <BouncyPressable
            style={[styles.serviceCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(personnel)/support')}
          >
            <View style={[styles.serviceIconBg, { backgroundColor: isDark ? '#042F2E' : '#CCFBF1' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={[styles.serviceTitle, { color: colors.text }]}>Welfare & Crisis Support</Text>
              <Text style={[styles.serviceSubtitle, { color: colors.textSecondary }]}>
                Direct confidential channel to Unit MO, Welfare Officer & peer buddy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </BouncyPressable>

          {/* Data Sovereignty */}
          <BouncyPressable
            style={[styles.serviceCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/(personnel)/privacy')}
          >
            <View style={[styles.serviceIconBg, { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' }]}>
              <Ionicons name="lock-closed" size={20} color={colors.stateConflicting} />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={[styles.serviceTitle, { color: colors.text }]}>Data Sovereignty & Privacy</Text>
              <Text style={[styles.serviceSubtitle, { color: colors.textSecondary }]}>
                Local encrypted SQLite repository · Zero unvetted cloud telemetry
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </BouncyPressable>
        </View>
      </FadeInView>

      {/* Modals */}
      <DailyCheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onSubmit={() => {
          setShowCheckIn(false);
          setHasCheckedIn(true);
          refresh();
        }}
      />

      <DoctorReportModal
        visible={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        onSaved={() => {
          refresh();
        }}
      />

      {/* 1-Tap Support & Whistleblower Hazard Reporting Modal */}
      <SupportRequestModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        onSubmitted={() => {
          refresh();
        }}
      />

      {/* Auto-Booked Consultation Details Modal */}
      <Modal
        visible={showConsultationModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowConsultationModal(false)}
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalCategoryTitle}>MILITARY MEDICAL CLEARANCE</Text>
              <Text style={styles.modalHeadline}>Auto-Scheduled MI Room Consultation</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowConsultationModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalStatusCard}>
            <View style={styles.modalStatusHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#DC2626" />
              <Text style={styles.modalStatusText}>
                {stressLevel === 'Critical' ? 'MANDATORY CLINICAL REFERRAL' : 'PREVENTIVE CLINICAL REFERRAL'}
              </Text>
            </View>
            <Text style={styles.modalStatusSub}>
              Booked automatically by Sahayak Welfare System under Zero-Undercounting Combat Readiness Protocol.
            </Text>
          </View>

          {/* Details Table */}
          <View style={styles.detailsGroup}>
            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Medical Officer</Text>
              <Text style={styles.detailFieldValue}>Capt. S. Nair, AMC (Duty MO)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Facility</Text>
              <Text style={styles.detailFieldValue}>Unit Medical Inspection (MI) Room</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Consultation Type</Text>
              <Text style={styles.detailFieldValue}>Mandatory MI Room Clearance</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Recommended Rest</Text>
              <Text style={styles.detailFieldValue}>
                {stressLevel === 'Critical' ? '48 Hours Stand-Down' : '24 Hours Rest Rotation'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Readiness State</Text>
              <Text style={[styles.detailFieldValue, { color: '#DC2626', fontWeight: '700' }]}>
                Temporary Stand-Down
              </Text>
            </View>
          </View>

          {/* Active AI Safety Findings */}
          <Text style={styles.modalSectionLabel}>CLINICAL & PSYCHOMOTOR FINDINGS</Text>
          <View style={styles.findingsBox}>
            <View style={styles.findingRow}>
              <Ionicons name="flash" size={16} color={Colors.light.warning} />
              <Text style={styles.findingText}>
                Psychomotor Latency: {Math.round(assessment?.subscores?.mini_games?.avg_reaction_time_ms ?? 450)}ms
              </Text>
            </View>
            <View style={styles.findingRow}>
              <Ionicons name="moon" size={16} color={Colors.light.accent} />
              <Text style={styles.findingText}>
                Sleep Duration: {assessment?.subscores?.self_assessment?.sleep_hours ?? 7.0} hours recorded
              </Text>
            </View>
            {assessment?.somatic_symptoms_flagged?.map((sym) => (
              <View key={sym} style={styles.findingRow}>
                <Ionicons name="pulse" size={16} color="#DC2626" />
                <Text style={styles.findingText}>Somatic Finding: {sym}</Text>
              </View>
            ))}
          </View>

          {/* Soldier Instructions */}
          <Text style={styles.modalSectionLabel}>DIRECTIVES FOR PERSONNEL</Text>
          <View style={styles.directivesBox}>
            <Text style={styles.directiveItem}>1. Report to the Unit MI Room immediately or at morning sick parade (0830 hrs).</Text>
            <Text style={styles.directiveItem}>2. Hand over live weapons and heavy operational duties to Kot NCO if on high-risk tasking.</Text>
            <Text style={styles.directiveItem}>3. Undergo routine vitals, neurological response, and cognitive re-check.</Text>
            <Text style={styles.directiveItem}>4. Duty resumption is subject to MO endorsement in the official register.</Text>
          </View>

          <TouchableOpacity
            style={styles.modalDismissBtn}
            onPress={() => setShowConsultationModal(false)}
          >
            <Text style={styles.modalDismissBtnText}>Acknowledged Directives</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
  },
  greetingSection: {
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.navy,
    textTransform: 'uppercase',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  stateCard: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scoreBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.navy,
  },
  stateMainText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  safetyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  safetyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  stateDescription: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 19,
    marginBottom: Spacing.three,
  },
  subsignalsContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  subsignalHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  signalGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  signalCard: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  signalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  signalTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  signalValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.navy,
  },
  signalSub: {
    fontSize: 8.5,
    lineHeight: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  divergenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#F0F9FF',
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  divergenceText: {
    flex: 1,
    fontSize: 11,
    color: Colors.light.primaryHover,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCardDone: {
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
  },
  doctorActionCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  actionCardTextContainer: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  uploadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  uploadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  activityList: {
    gap: Spacing.two,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  miniIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  activityItemDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  activityItemStatusSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.success,
  },
  activityItemStatusAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.sm,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.two,
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.navy,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  trendVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.navy,
  },
  gridValueMain: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.navy,
    marginTop: 2,
  },
  gridValueSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  alertBanner: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  alertBannerCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  alertBannerHigh: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alertStandDownBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  alertStandDownText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertBannerMessage: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  alertConsultationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alertConsultationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  alertConsultationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.navy,
  },
  alertConsultationDetail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  alertConsultationId: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  alertConsultationBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  alertConsultationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  somaticFlaggedBox: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    backgroundColor: '#FAF5FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  somaticFlaggedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  somaticFlaggedHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B21A8',
  },
  somaticBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  somaticFlaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  somaticFlaggedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  safetyTriggersBox: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  safetyTriggersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  safetyTriggersHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  safetyTriggerItem: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
    marginTop: 2,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContent: {
    padding: Spacing.five,
    paddingBottom: Spacing.ten,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  modalCategoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  modalHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.navy,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: Spacing.one,
  },
  modalStatusCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: Spacing.four,
  },
  modalStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  modalStatusSub: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  detailsGroup: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  detailFieldLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  detailFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.navy,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  findingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.four,
    gap: 8,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findingText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  directivesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.six,
    gap: 6,
  },
  directiveItem: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  modalDismissBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.four,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadow.sm,
  },
  modalDismissBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  /* Operational & Sovereignty Services Grid */
  servicesGrid: {
    gap: Spacing.three,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  serviceIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  oneTapSupportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.xl,
    marginBottom: Spacing.four,
    gap: Spacing.three,
    ...Shadow.md,
  },
  oneTapSupportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  oneTapSupportTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  oneTapPillTag: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  oneTapPillTagText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '900',
  },
  oneTapSupportSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  oneTapArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

