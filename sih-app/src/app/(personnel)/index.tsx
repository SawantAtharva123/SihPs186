import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import DailyCheckInModal from '@/components/DailyCheckInModal';

export default function PersonnelHomeScreen() {
  const router = useRouter();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>GOOD MORNING, Rohan</Text>
        <Text style={styles.greetingSubtitle}>Your wellbeing overview for today</Text>
      </View>

      {/* Current State Card */}
      <View style={styles.stateCard}>
        <View style={styles.stateHeader}>
          <Ionicons name="analytics" size={20} color={Colors.light.stateEmerging} />
          <Text style={styles.stateLabel}>CURRENT STATE</Text>
        </View>
        <Text style={styles.stateMainText}>Emerging Change</Text>
        <View style={styles.confidenceRow}>
          <Ionicons name="information-circle" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.confidenceText}>Confidence: Moderate (78%)</Text>
        </View>
        <Text style={styles.stateDescription}>
          A mild variation from your normal 30-day baseline has been detected over the past 3 days.
        </Text>
      </View>

      {/* Daily Check-in Card */}
      <TouchableOpacity 
        style={[styles.actionCard, hasCheckedIn ? styles.actionCardDone : null]}
        onPress={() => !hasCheckedIn && setShowCheckIn(true)}
        disabled={hasCheckedIn}
      >
        <View style={styles.actionCardHeader}>
          <View style={styles.actionIconBg}>
            <Ionicons name="clipboard" size={24} color={hasCheckedIn ? Colors.light.success : Colors.light.primary} />
          </View>
          <View style={styles.actionCardTextContainer}>
            <Text style={styles.actionCardTitle}>Daily Check-in</Text>
            <Text style={styles.actionCardSubtitle}>
              {hasCheckedIn ? "Completed today at 07:15 AM" : "Takes about 30 seconds"}
            </Text>
          </View>
          <Ionicons 
            name={hasCheckedIn ? "checkmark-circle" : "chevron-forward"} 
            size={24} 
            color={hasCheckedIn ? Colors.light.success : Colors.light.textMuted} 
          />
        </View>
      </TouchableOpacity>

      {/* Today's Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY'S ACTIVITIES</Text>
        <View style={styles.activityList}>
          <TouchableOpacity style={styles.activityItem} onPress={() => router.push('/(personnel)/activities')}>
            <View style={styles.activityItemLeft}>
              <Ionicons name="flash" size={20} color={Colors.light.success} />
              <Text style={styles.activityItemTitle}>Quick Tap</Text>
            </View>
            <Text style={styles.activityItemStatusSuccess}>Completed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.activityItem} onPress={() => router.push('/(personnel)/activities')}>
            <View style={styles.activityItemLeft}>
              <Ionicons name="hand-right" size={20} color={Colors.light.primary} />
              <Text style={styles.activityItemTitle}>Go / No-Go</Text>
            </View>
            <Text style={styles.activityItemStatusAction}>Recommended</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.activityItem} onPress={() => router.push('/(personnel)/activities')}>
            <View style={styles.activityItemLeft}>
              <Ionicons name="grid" size={20} color={Colors.light.textMuted} />
              <Text style={styles.activityItemTitle}>Sequence Recall</Text>
            </View>
            <Text style={styles.activityItemStatusNeutral}>Not completed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid of Previews */}
      <View style={styles.gridContainer}>
        {/* My Trends */}
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(personnel)/trends')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="trending-up" size={20} color={Colors.light.accent} />
            <Text style={styles.gridCardTitle}>MY TRENDS</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Sleep</Text>
            <Ionicons name="arrow-down" size={16} color={Colors.light.warning} />
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Workload</Text>
            <Ionicons name="arrow-up" size={16} color={Colors.light.warning} />
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Recovery</Text>
            <Ionicons name="arrow-down" size={16} color={Colors.light.stateEmerging} />
          </View>
        </TouchableOpacity>

        {/* Recovery */}
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(personnel)/recovery')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="battery-charging" size={20} color={Colors.light.success} />
            <Text style={styles.gridCardTitle}>RECOVERY</Text>
          </View>
          <Text style={styles.gridValueMain}>Moderate</Text>
          <Text style={styles.gridValueSub}>Debt: +12 units</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {/* Unit Pulse */}
        <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(personnel)/pulse')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="pulse" size={20} color={Colors.light.primary} />
            <Text style={styles.gridCardTitle}>UNIT PULSE</Text>
          </View>
          <Text style={styles.gridValueMain}>Improving</Text>
          <Text style={styles.gridValueSub}>Trend for Unit 402</Text>
        </TouchableOpacity>

        {/* Support */}
        <TouchableOpacity style={[styles.gridCard, { backgroundColor: Colors.light.primaryLight }]} onPress={() => router.push('/(personnel)/support')}>
          <View style={styles.gridCardHeader}>
            <Ionicons name="medkit" size={20} color={Colors.light.primary} />
            <Text style={styles.gridCardTitle}>SUPPORT</Text>
          </View>
          <Text style={[styles.gridValueMain, { color: Colors.light.primaryHover, fontSize: 14, marginTop: 4 }]}>
            Need to talk?
          </Text>
          <Text style={[styles.gridValueSub, { color: Colors.light.primary }]}>Tap for resources</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.ten }} />

      <DailyCheckInModal 
        visible={showCheckIn} 
        onClose={() => setShowCheckIn(false)}
        onSubmit={() => {
          setShowCheckIn(false);
          setHasCheckedIn(true);
        }}
      />
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
  },
  greetingSection: {
    marginBottom: Spacing.six,
    marginTop: Spacing.two,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.navy,
    textTransform: 'uppercase',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stateCard: {
    backgroundColor: Colors.light.stateEmergingBg,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: '#BAE6FD', // Sky 200
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.stateEmerging,
    letterSpacing: 0.5,
  },
  stateMainText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.stateEmerging,
    marginBottom: Spacing.one,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.two,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  stateDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.six,
    ...Shadow.sm,
  },
  actionCardDone: {
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
    borderWidth: 1,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  actionCardTextContainer: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.three,
  },
  activityList: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  activityItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activityItemStatusSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.success,
  },
  activityItemStatusAction: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  activityItemStatusNeutral: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textMuted,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    ...Shadow.sm,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  trendLabel: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  gridValueMain: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  gridValueSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});

