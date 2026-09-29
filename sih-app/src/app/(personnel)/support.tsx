import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSahayak } from '@/context/SahayakContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';
import SupportRequestModal from '@/components/SupportRequestModal';
import {
  getSupportRequestsForUser,
} from '@/repositories/support';
import { SupportRequestRecord, SupportOptionType } from '@/types/sahayak';
import { useFocusEffect } from 'expo-router';

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const { currentUser } = useSahayak();

  const [modalVisible, setModalVisible] = useState(false);
  const [initialType, setInitialType] = useState<SupportOptionType | undefined>(undefined);
  const [userRequests, setUserRequests] = useState<SupportRequestRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportRequestRecord | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const records = await getSupportRequestsForUser(currentUser?.id || 'soldier-104');
      setUserRequests(records);
    } catch (err) {
      console.warn('Failed to load support requests:', err);
    }
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleOpenSupport = (type?: SupportOptionType) => {
    setInitialType(type);
    setModalVisible(true);
  };

  const handleContact = (name: string) => {
    Alert.alert(`Connecting with ${name}`, `Initiating secure unit communication channel...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return { text: '#10B981', bg: isDark ? '#064E3B' : '#ECFDF5' };
      case 'In Progress':
      case 'Dispatched':
        return { text: '#0284C7', bg: isDark ? '#082F49' : '#EFF6FF' };
      case 'Under Review':
      case 'Acknowledged':
        return { text: '#D97706', bg: isDark ? '#451A03' : '#FFFBEB' };
      default:
        return { text: '#6366F1', bg: isDark ? '#1E1B4B' : '#EEF2FF' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '#EF4444', bg: isDark ? '#4C0519' : '#FEF2F2' };
      case 'high':
        return { color: '#F59E0B', bg: isDark ? '#451A03' : '#FFFBEB' };
      case 'medium':
        return { color: '#0284C7', bg: isDark ? '#082F49' : '#EFF6FF' };
      default:
        return { color: '#10B981', bg: isDark ? '#064E3B' : '#ECFDF5' };
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <FadeInView delay={50}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Welfare & Crisis Support</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            1-Tap Assistance, Whistleblower Hazard Reports & Confidential Welfare
          </Text>
        </View>
      </FadeInView>

      {/* ── 1-TAP ASSISTANCE HERO BUTTON ─────────────────────────── */}
      <FadeInView delay={100}>
        <BouncyPressable
          style={[styles.mainAction, { backgroundColor: '#DC2626' }]}
          onPress={() => handleOpenSupport()}
        >
          <View style={styles.mainActionIconCircle}>
            <Ionicons name="hand-left" size={28} color="#fff" />
          </View>
          <View style={styles.mainActionText}>
            <View style={styles.badgeLine}>
              <Text style={styles.mainActionTitle}>I Need Support</Text>
              <View style={styles.oneTapPill}>
                <Text style={styles.oneTapPillText}>1-TAP DISPATCH</Text>
              </View>
            </View>
            <Text style={styles.mainActionSub}>
              Direct Welfare Callback, Private Meeting, Facility Hazard or Workload Issue
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
        </BouncyPressable>
      </FadeInView>

      {/* ── FAST DISPATCH SHORTCUT TILES ─────────────────────────── */}
      <FadeInView delay={140}>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => handleOpenSupport('facility_issue')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]}>
              <Ionicons name="construct" size={20} color="#DC2626" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Report Facility</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Water, Power, Mess</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => handleOpenSupport('officer_callback')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
              <Ionicons name="call" size={20} color="#0284C7" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Officer Callback</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Scheduled phone call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => handleOpenSupport('private_meeting')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Private Meeting</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>1-on-1 MI Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => handleOpenSupport('workload_issue')}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
              <Ionicons name="speedometer" size={20} color="#D97706" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Workload Strain</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Night shift fatigue</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      {/* ── MY SUBMITTED REQUESTS & TRACKING ─────────────────────── */}
      <FadeInView delay={180}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="list" size={18} color={colors.primary} />
            <Text style={[styles.sectionHeading, { color: isDark ? '#F8FAFC' : colors.navy }]}>
              MY SUPPORT TICKETS & HAZARD REPORTS ({userRequests.length})
            </Text>
          </View>
          <TouchableOpacity onPress={fetchRequests}>
            <Text style={[styles.refreshLink, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {userRequests.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyBoxTitle, { color: colors.text }]}>No Active Support Tickets</Text>
            <Text style={[styles.emptyBoxSub, { color: colors.textSecondary }]}>
              Any request submitted via "I Need Support" or anonymous facility report will generate an official ID and track live status here.
            </Text>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {userRequests.map((req) => {
              const statusTheme = getStatusColor(req.status);
              const priorityTheme = getPriorityBadge(req.priority);
              return (
                <TouchableOpacity
                  key={req.id}
                  style={[styles.ticketCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                  onPress={() => setSelectedTicket(req)}
                >
                  <View style={styles.ticketTopRow}>
                    <View style={styles.ticketIdRow}>
                      <Text style={[styles.ticketId, { color: colors.primary }]}>{req.id}</Text>
                      {req.isAnonymous && (
                        <View style={[styles.anonPill, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                          <Ionicons name="shield-checkmark" size={11} color="#6366F1" />
                          <Text style={styles.anonPillText}>ANON</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>{req.status}</Text>
                    </View>
                  </View>

                  <Text style={[styles.ticketCategory, { color: colors.text }]}>{req.categoryTitle}</Text>
                  
                  {req.location && (
                    <Text style={[styles.ticketLocation, { color: colors.textSecondary }]}>
                      📍 {req.location}
                    </Text>
                  )}

                  <Text style={[styles.ticketNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                    {req.notes}
                  </Text>

                  <View style={styles.ticketFooter}>
                    <View style={[styles.priorityTag, { backgroundColor: priorityTheme.bg }]}>
                      <Text style={[styles.priorityTagText, { color: priorityTheme.color }]}>
                        {req.priority.toUpperCase()} PRIORITY
                      </Text>
                    </View>
                    {req.photos && req.photos.length > 0 && (
                      <View style={styles.photoCountTag}>
                        <Ionicons name="image" size={12} color={colors.textSecondary} />
                        <Text style={[styles.photoCountText, { color: colors.textSecondary }]}>
                          {req.photos.length} Photo
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </FadeInView>

      {/* ── WELFARE OFFICER & BUDDY DIRECT CONTACT CARDS ─────────── */}
      <FadeInView delay={220}>
        <Text style={[styles.sectionHeading, { color: isDark ? '#F8FAFC' : colors.navy, marginTop: Spacing.six }]}>
          UNIT CONTACTS & DIRECT CHANNELS
        </Text>

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.2)' : colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Capt. Meera Nair</Text>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.cardSub, { color: colors.success }]}>Welfare Officer • On Duty</Text>
              </View>
            </View>
          </View>
          <BouncyPressable
            style={[styles.btn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
            onPress={() => handleOpenSupport('officer_callback')}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Request Direct Officer Call Back</Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      <FadeInView delay={260}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : '#EBF9F1' }]}>
              <Ionicons name="people" size={24} color={colors.success} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cpl. Rajan Kumar</Text>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.cardSub, { color: colors.success }]}>Assigned Buddy • Available</Text>
              </View>
            </View>
          </View>
          <BouncyPressable
            style={[styles.btn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
            onPress={() => handleOpenSupport('buddy_contact')}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text style={[styles.btnText, { color: colors.text }]}>Message / Request Buddy Check-in</Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      {/* ── EMERGENCY 24/7 HELPLINES ─────────────────────────────── */}
      <FadeInView delay={300}>
        <View
          style={[
            styles.emergencyCard,
            {
              backgroundColor: isDark ? 'rgba(231, 76, 60, 0.12)' : colors.stateSustainedBg,
              borderColor: isDark ? 'rgba(231, 76, 60, 0.3)' : colors.stateSustained,
            },
          ]}
        >
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={20} color={colors.stateSustained} />
            <Text style={[styles.emergencyTitle, { color: colors.stateSustained }]}>Emergency 24/7 Crisis Helplines</Text>
          </View>
          <View style={styles.emergencyRow}>
            <Ionicons name="call" size={18} color={colors.stateSustained} />
            <Text style={[styles.emergencyText, { color: colors.stateSustained }]}>Crisis Line: 1-800-273-8255 (Toll Free)</Text>
          </View>
          <View style={styles.emergencyRow}>
            <Ionicons name="medkit" size={18} color={colors.stateSustained} />
            <Text style={[styles.emergencyText, { color: colors.stateSustained }]}>Station Medical Emergency: 911 / Extension 101</Text>
          </View>
        </View>
      </FadeInView>
      
      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        All support inquiries and anonymous whistleblower reports are processed under strict military confidentiality laws.
      </Text>
      <View style={{ height: 40 }} />

      {/* Support Request / Facility Reporting Modal */}
      <SupportRequestModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialType={initialType}
        onSubmitted={() => {
          fetchRequests();
        }}
      />

      {/* Ticket Details Modal */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={[styles.ticketModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.ticketModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.ticketModalTitle, { color: colors.text }]}>Ticket {selectedTicket?.id}</Text>
            <TouchableOpacity onPress={() => setSelectedTicket(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedTicket && (
            <ScrollView style={styles.ticketModalBody} contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status).bg }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedTicket.status).text }]}>
                      {selectedTicket.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>{selectedTicket.categoryTitle}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Whistleblower Shield</Text>
                  <Text style={[styles.detailVal, { color: selectedTicket.isAnonymous ? '#10B981' : colors.text }]}>
                    {selectedTicket.isAnonymous ? 'Protected / Anonymous' : 'Named Personnel'}
                  </Text>
                </View>
                {selectedTicket.location && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{selectedTicket.location}</Text>
                  </View>
                )}
                {selectedTicket.preferredTimeWindow && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Preferred Time</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{selectedTicket.preferredTimeWindow}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SUBMITTED DESCRIPTION</Text>
                <Text style={[styles.detailNotesText, { color: colors.text }]}>{selectedTicket.notes}</Text>
              </View>

              {selectedTicket.officerNotes && (
                <View style={[styles.officerNotesBox, { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: '#0284C7' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#0284C7" />
                    <Text style={{ fontWeight: '800', color: '#0284C7', fontSize: 13 }}>WELFARE OFFICER RESPONSE</Text>
                  </View>
                  <Text style={{ color: isDark ? '#E0F2FE' : '#0369A1', fontSize: 13, lineHeight: 18 }}>
                    {selectedTicket.officerNotes}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedTicket(null)}
              >
                <Text style={styles.closeModalBtnText}>Close View</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four },
  header: { marginBottom: Spacing.four },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  // Hero 1-Tap Action
  mainAction: {
    flexDirection: 'row',
    padding: Spacing.five,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginBottom: Spacing.four,
    ...Shadow.md,
  },
  mainActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionText: { marginLeft: Spacing.four, flex: 1 },
  badgeLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  mainActionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  oneTapPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oneTapPillText: { color: '#DC2626', fontSize: 9, fontWeight: '900' },
  mainActionSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2, lineHeight: 16 },

  // Quick dispatch tiles
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.five },
  quickTile: {
    width: '48.5%',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    ...Shadow.sm,
  },
  quickIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickTitle: { fontSize: 13, fontWeight: '800' },
  quickSub: { fontSize: 11, marginTop: 2 },

  // Section Headers
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  sectionHeading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  refreshLink: { fontSize: 12, fontWeight: '700' },

  // Empty box
  emptyBox: { padding: Spacing.five, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', marginBottom: Spacing.four },
  emptyBoxTitle: { fontSize: 15, fontWeight: '800', marginTop: Spacing.two },
  emptyBoxSub: { fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 17, maxWidth: 300 },

  // Tickets List
  ticketsList: { gap: Spacing.three, marginBottom: Spacing.four },
  ticketCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, ...Shadow.sm },
  ticketTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketId: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  anonPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  anonPillText: { fontSize: 9, fontWeight: '800', color: '#6366F1' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  ticketCategory: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  ticketLocation: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  ticketNotes: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityTagText: { fontSize: 10, fontWeight: '800' },
  photoCountTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoCountText: { fontSize: 11, fontWeight: '600' },
  ticketDate: { marginLeft: 'auto', fontSize: 11 },

  // Contact cards
  card: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { marginLeft: Spacing.three, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  statusIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardSub: { fontSize: 12, fontWeight: '600' },
  btn: { flexDirection: 'row', padding: Spacing.three, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  btnText: { fontWeight: '700', fontSize: 13 },

  // Emergency card
  emergencyCard: { padding: Spacing.four, borderRadius: Radius.lg, marginTop: Spacing.two, borderWidth: 1 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.three },
  emergencyTitle: { fontWeight: '800', fontSize: 14 },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two, gap: Spacing.three },
  emergencyText: { fontWeight: '600', fontSize: 13 },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: Spacing.six, paddingHorizontal: Spacing.four, lineHeight: 18 },

  // Ticket modal
  ticketModalContainer: { flex: 1 },
  ticketModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  ticketModalTitle: { fontSize: 18, fontWeight: '800' },
  ticketModalBody: { flex: 1 },
  detailCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.three },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13 },
  detailVal: { fontSize: 13, fontWeight: '700' },
  detailNotesText: { fontSize: 14, lineHeight: 20 },
  officerNotesBox: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1 },
  closeModalBtn: { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.two },
  closeModalBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
