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
import { useStressAssessment } from '@/hooks/useStressAssessment';
import { useSahayak } from '@/context/SahayakContext';

export default function PersonnelHomeScreen() {
  const router = useRouter();
  const { currentUser, isOffline } = useSahayak();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
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
          color: Colors.light.stateSustained,
          bg: Colors.light.stateSustainedBg,
          border: '#FECACA',
          icon: 'alert-circle',
          desc: 'High cumulative load and acute fatigue detected across multiple signal families. Conservative welfare safety active.',
        };
      case 'High':
        return {
          color: Colors.light.warning,
          bg: '#FFF8E6',
          border: '#FDE68A',
          icon: 'warning',
          desc: 'Elevated stress response detected. Rest rotation and sleep recovery recommended to prevent chronic exhaustion.',
        };
      case 'Medium':
        return {
          color: Colors.light.stateEmerging,
          bg: Colors.light.stateEmergingBg,
          border: '#BAE6FD',
          icon: 'analytics',
          desc: 'Moderate routine strain within manageable limits. Baseline consistency is maintained.',
        };
      default:
        return {
          color: Colors.light.success,
          bg: '#EBF9F1',
          border: '#A7F3D0',
          icon: 'checkmark-circle',
          desc: 'Balanced physiological, cognitive, and self-reported wellness state.',
        };
    }
  };

  const theme = getLevelTheme(stressLevel);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.greetingTitle}>
              GOOD MORNING, {currentUser?.name?.split(' ')[0] ?? 'Rohan'}
            </Text>
            <Text style={styles.greetingSubtitle}>Integrated Welfare & Stress Intelligence</Text>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={14} color={Colors.light.warning} />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── REST ADVISORY & AUTO-BOOKED CONSULTATION BANNER ──────── */}
      {(stressLevel === 'Critical' || stressLevel === 'High' || assessment?.auto_consultation_required) && (
        <View
          style={[
            styles.alertBanner,
            stressLevel === 'Critical' ? styles.alertBannerCritical : styles.alertBannerHigh,
          ]}
        >
          <View style={styles.alertBannerHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons
                name={stressLevel === 'Critical' ? 'alert-circle' : 'warning'}
                size={22}
                color={stressLevel === 'Critical' ? '#DC2626' : '#D97706'}
              />
              <Text
                style={[
                  styles.alertBannerTitle,
                  { color: stressLevel === 'Critical' ? '#991B1B' : '#92400E' },
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
                { backgroundColor: stressLevel === 'Critical' ? '#FEE2E2' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.alertStandDownText,
                  { color: stressLevel === 'Critical' ? '#B91C1C' : '#B45309' },
                ]}
              >
                {stressLevel === 'Critical' ? 'MANDATORY STAND-DOWN' : 'REST ADVISED'}
              </Text>
            </View>
          </View>

          <Text style={styles.alertBannerMessage}>
            {stressLevel === 'Critical'
              ? 'Acute psychomotor slowing or severe cumulative fatigue detected. Immediate stand-down from tactical and arms duty advised. Mandatory 24-48h restorative rotation.'
              : 'Elevated cognitive latency or physical strain detected. Operational rest rotation recommended to prevent severe exhaustion.'}
          </Text>

          {/* Consultation auto-booked pill */}
          <View style={styles.alertConsultationBox}>
            <View style={styles.alertConsultationRow}>
              <Ionicons name="medkit" size={16} color="#DC2626" />
              <Text style={styles.alertConsultationTitle}>
                MI Room Consultation Auto-Booked
              </Text>
            </View>
            <Text style={styles.alertConsultationDetail}>
              Assigned: Capt. S. Nair, AMC (Duty Medical Officer) · Unit MI Room
            </Text>
            {autoConsultation && (
              <Text style={styles.alertConsultationId}>
                Ref ID: {autoConsultation.id.slice(0, 10).toUpperCase()} · Status: Pending Officer Clearance
              </Text>
            )}
            <TouchableOpacity
              style={styles.alertConsultationBtn}
              onPress={() => setShowConsultationModal(true)}
            >
              <Text style={styles.alertConsultationBtnText}>View Appointment Details & Triggers →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── LIVE MULTI-MODAL STRESS ASSESSMENT CARD ────────────────── */}
      <View style={[styles.stateCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View style={styles.stateHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name={theme.icon as any} size={20} color={theme.color} />
            <Text style={[styles.stateLabel, { color: theme.color }]}>
              MULTI-MODAL STRESS LEVEL
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{stressScore.toFixed(0)}/100</Text>
          </View>
        </View>

        <Text style={[styles.stateMainText, { color: theme.color }]}>
          {stressLevel} Stress Risk
        </Text>

        {/* Confidence & Asymmetric Safety Pill */}
        <View style={styles.badgeRow}>
          <View style={styles.confidenceRow}>
            <Ionicons name="information-circle" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(confidence * 100)}%
            </Text>
          </View>
          <View style={styles.safetyPill}>
            <Ionicons name="shield-checkmark" size={12} color="#059669" />
            <Text style={styles.safetyPillText}>Asymmetric Loss · Zero-Undercounting Bias</Text>
          </View>
        </View>

        <Text style={styles.stateDescription}>{theme.desc}</Text>

        {/* Multi-Modal Sub-Signals Breakdown */}
        <View style={styles.subsignalsContainer}>
          <Text style={styles.subsignalHeader}>INPUT SIGNAL TRIANGULATION</Text>
          
          <View style={styles.signalGrid}>
            {/* 1. Doctor Reports */}
            <View style={styles.signalCard}>
              <View style={styles.signalCardHeader}>
                <Ionicons name="medkit" size={16} color={Colors.light.primary} />
                <Text style={styles.signalTitle}>Doctor Reports</Text>
              </View>
              <Text style={styles.signalValue}>
                {assessment?.subscores?.doctor_reports?.clinical_indicator ?? 'Normal'}
              </Text>
              <Text style={styles.signalSub}>
                {assessment?.subscores?.doctor_reports?.consultations ?? 0} consult(s) · {assessment?.subscores?.doctor_reports?.sick_leave_days ?? 0}d leave
              </Text>
            </View>

            {/* 2. Mini-Games Reaction Timing */}
            <View style={styles.signalCard}>
              <View style={styles.signalCardHeader}>
                <Ionicons name="flash" size={16} color={Colors.light.warning} />
                <Text style={styles.signalTitle}>Mini-Games</Text>
              </View>
              <Text style={styles.signalValue}>
                {Math.round(assessment?.subscores?.mini_games?.avg_reaction_time_ms ?? 450)} ms
              </Text>
              <Text style={styles.signalSub}>
                ±{Math.round(assessment?.subscores?.mini_games?.reaction_variability_ms ?? 38)}ms var · {assessment?.subscores?.mini_games?.accuracy_pct ?? 90}% acc
              </Text>
            </View>

            {/* 3. Sleep & Self-Assessment */}
            <View style={styles.signalCard}>
              <View style={styles.signalCardHeader}>
                <Ionicons name="moon" size={16} color={Colors.light.accent} />
                <Text style={styles.signalTitle}>Self Check-in</Text>
              </View>
              <Text style={styles.signalValue}>
                {assessment?.subscores?.self_assessment?.sleep_hours?.toFixed(1) ?? '7.0'} hrs
              </Text>
              <Text style={styles.signalSub}>
                Sleep duration · {assessment?.subscores?.self_assessment?.state ?? 'Normal'} state
              </Text>
            </View>
          </View>
        </View>

        {/* Signal Disagreement Warning if Active */}
        {assessment?.signal_agreement?.disagreement_detected && (
          <View style={styles.divergenceCard}>
            <Ionicons name="git-branch" size={16} color={Colors.light.stateEmerging} />
            <Text style={styles.divergenceText}>
              {assessment?.signal_agreement?.divergence_note}
            </Text>
          </View>
        )}

        {/* Somatic Symptoms Flagged (NLP Extraction) */}
        {assessment?.somatic_symptoms_flagged && assessment.somatic_symptoms_flagged.length > 0 && (
          <View style={styles.somaticFlaggedBox}>
            <View style={styles.somaticFlaggedHeaderRow}>
              <Ionicons name="sparkles" size={14} color="#7C3AED" />
              <Text style={styles.somaticFlaggedHeader}>SOMATIC SYMPTOMS DETECTED (NLP):</Text>
            </View>
            <View style={styles.somaticBadgeRow}>
              {assessment.somatic_symptoms_flagged.map((sym) => (
                <View key={sym} style={styles.somaticFlaggedBadge}>
                  <Ionicons name="pulse" size={12} color="#DC2626" />
                  <Text style={styles.somaticFlaggedBadgeText}>{sym}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Safety Guardrail Triggers */}
        {assessment?.safety_guardrails?.safety_triggers && assessment.safety_guardrails.safety_triggers.length > 0 && (
          <View style={styles.safetyTriggersBox}>
            <View style={styles.safetyTriggersHeaderRow}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.safetyTriggersHeader}>ACTIVE SAFETY GUARDRAIL TRIGGERS:</Text>
            </View>
            {assessment.safety_guardrails.safety_triggers.map((trig, idx) => (
              <Text key={idx} style={styles.safetyTriggerItem}>• {trig}</Text>
            ))}
          </View>
        )}
      </View>

      {/* ── DAILY CHECK-IN ACTION CARD ────────────────────────────── */}
      <TouchableOpacity
        style={[styles.actionCard, hasCheckedIn ? styles.actionCardDone : null]}
        onPress={() => setShowCheckIn(true)}
      >
        <View style={styles.actionCardHeader}>
          <View style={styles.actionIconBg}>
            <Ionicons
              name="clipboard"
              size={24}
              color={hasCheckedIn ? Colors.light.success : Colors.light.primary}
            />
          </View>
          <View style={styles.actionCardTextContainer}>
            <Text style={styles.actionCardTitle}>Daily Wellbeing Check-in</Text>
            <Text style={styles.actionCardSubtitle}>
              {hasCheckedIn
                ? `Logged: ${assessment?.subscores?.self_assessment?.sleep_hours ?? 7.0} hours sleep`
                : 'Log exact sleep hours, workload & energy (~30s)'}
            </Text>
          </View>
          <Ionicons
            name={hasCheckedIn ? 'checkmark-circle' : 'chevron-forward'}
            size={24}
            color={hasCheckedIn ? Colors.light.success : Colors.light.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* ── DOCTOR / MEDICAL REPORTS UPLOAD CARD ─────────────────── */}
      <TouchableOpacity
        style={styles.doctorActionCard}
        onPress={() => setShowDoctorModal(true)}
      >
        <View style={styles.actionCardHeader}>
          <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="medical" size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.actionCardTextContainer}>
            <Text style={styles.actionCardTitle}>Medical & Doctor Reports</Text>
            <Text style={styles.actionCardSubtitle}>
              Upload consultations or sick notes to update AI clinical safety
            </Text>
          </View>
          <View style={styles.uploadBadge}>
            <Ionicons name="cloud-upload" size={14} color={Colors.light.primary} />
            <Text style={styles.uploadBadgeText}>Upload</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── TODAY'S MINI-GAMES / COGNITIVE ACTIVITIES ────────────── */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three }}>
          <Text style={styles.sectionTitle}>COGNITIVE MICRO-TASKS</Text>
          <TouchableOpacity onPress={() => router.push('/(personnel)/activities')}>
            <Text style={styles.seeAllText}>All Activities →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          <TouchableOpacity
            style={styles.activityItem}
            onPress={() => router.push('/(personnel)/activities')}
          >
            <View style={styles.activityItemLeft}>
              <View style={[styles.miniIconBg, { backgroundColor: '#EBF9F1' }]}>
                <Ionicons name="flash" size={18} color={Colors.light.success} />
              </View>
              <View>
                <Text style={styles.activityItemTitle}>Quick Tap</Text>
                <Text style={styles.activityItemDesc}>Reaction timing & motor stability (~20s)</Text>
              </View>
            </View>
            <Text style={styles.activityItemStatusSuccess}>Play & Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activityItem}
            onPress={() => router.push('/(personnel)/activities')}
          >
            <View style={styles.activityItemLeft}>
              <View style={[styles.miniIconBg, { backgroundColor: Colors.light.primaryLight }]}>
                <Ionicons name="hand-right" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.activityItemTitle}>Go / No-Go</Text>
                <Text style={styles.activityItemDesc}>Inhibitory control & attention (~30s)</Text>
              </View>
            </View>
            <Text style={styles.activityItemStatusAction}>Recommended</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── GRID OF PREVIEWS ──────────────────────────────────────── */}
      <View style={styles.gridContainer}>
        {/* My Trends */}
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(personnel)/trends')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="trending-up" size={18} color={Colors.light.accent} />
            <Text style={styles.gridCardTitle}>MY TRENDS</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Sleep</Text>
            <Text style={styles.trendVal}>{assessment?.subscores?.self_assessment?.sleep_hours ?? 7.0}h</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Reaction</Text>
            <Text style={styles.trendVal}>{Math.round(assessment?.subscores?.mini_games?.avg_reaction_time_ms ?? 450)}ms</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Stress Risk</Text>
            <Text style={[styles.trendVal, { color: theme.color, fontWeight: '700' }]}>{stressLevel}</Text>
          </View>
        </TouchableOpacity>

        {/* Recovery */}
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(personnel)/recovery')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="battery-charging" size={18} color={Colors.light.success} />
            <Text style={styles.gridCardTitle}>RECOVERY</Text>
          </View>
          <Text style={styles.gridValueMain}>
            {stressLevel === 'Low' ? 'Restored' : stressLevel === 'Medium' ? 'Moderate' : 'Debt Alert'}
          </Text>
          <Text style={styles.gridValueSub}>
            Load Index: {stressScore.toFixed(0)} / 100
          </Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  signalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  signalTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  signalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.navy,
  },
  signalSub: {
    fontSize: 9,
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
});
