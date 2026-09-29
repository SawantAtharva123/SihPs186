import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from 'expo-router';
import {
  getAllSupportRequestsForQueue,
  updateSupportRequestStatus,
} from '@/repositories/support';
import { SupportRequestRecord } from '@/types/sahayak';

export default function CasesScreen() {
  const { colors, isDark } = useTheme();

  // Tab: 'queue' = Support & Facility Queue, 'cases' = Clinical Welfare Cases
  const [activeTab, setActiveTab] = useState<'queue' | 'cases'>('queue');
  const [queueFilter, setQueueFilter] = useState<'all' | 'facility' | 'callback' | 'meeting' | 'workload' | 'anonymous'>('all');

  // Support Queue data
  const [queueItems, setQueueItems] = useState<SupportRequestRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestRecord | null>(null);
  const [officerRemark, setOfficerRemark] = useState('');
  const [updating, setUpdating] = useState(false);

  // Clinical cases
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const mockCases = [
    { id: 'C-084', name: 'Rohan Verma', status: 'Intervention Planned', priority: 'High', date: 'Oct 12', reason: 'Cumulative Sleep Debt' },
    { id: 'C-082', name: 'Amit Singh', status: 'Under Review', priority: 'Routine', date: 'Oct 10', reason: 'Schedule Volatility' },
    { id: 'C-078', name: 'Priya Sharma', status: 'New', priority: 'Routine', date: 'Oct 09', reason: 'Conflicting Signals' },
    { id: 'C-071', name: 'Vikram Das', status: 'Follow-up', priority: 'Routine', date: 'Oct 05', reason: 'Recovery Decline' },
  ];

  const fetchQueue = useCallback(async () => {
    try {
      const items = await getAllSupportRequestsForQueue();
      setQueueItems(items);
    } catch (err) {
      console.warn('Failed to load support queue:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchQueue();
    }, [fetchQueue])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQueue();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (newStatus: SupportRequestRecord['status']) => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      await updateSupportRequestStatus(
        selectedRequest.id,
        newStatus,
        officerRemark.trim() || undefined,
        'Capt. Meera Nair'
      );
      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              officerNotes: officerRemark.trim() || prev.officerNotes,
              assignedOfficer: 'Capt. Meera Nair',
            }
          : null
      );
      await fetchQueue();
      Alert.alert('Status Updated', `Ticket ${selectedRequest.id} marked as "${newStatus}".`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update ticket status.');
    } finally {
      setUpdating(false);
    }
  };

  // Filter items in the queue
  const filteredQueue = queueItems.filter((item) => {
    if (queueFilter === 'facility') return item.requestType === 'facility_issue';
    if (queueFilter === 'callback') return item.requestType === 'officer_callback';
    if (queueFilter === 'meeting') return item.requestType === 'private_meeting';
    if (queueFilter === 'workload') return item.requestType === 'workload_issue' || item.requestType === 'schedule_problem';
    if (queueFilter === 'anonymous') return item.isAnonymous;
    return true;
  });

  const urgentCount = queueItems.filter((i) => i.priority === 'urgent' && i.status !== 'Resolved').length;

  const getPriorityTheme = (p: string) => {
    switch (p) {
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

  const getStatusTheme = (s: string) => {
    switch (s) {
      case 'Resolved':
      case 'Closed':
        return { color: '#10B981', bg: isDark ? '#064E3B' : '#ECFDF5' };
      case 'Dispatched':
      case 'In Progress':
        return { color: '#0284C7', bg: isDark ? '#082F49' : '#EFF6FF' };
      case 'Under Review':
      case 'Acknowledged':
        return { color: '#D97706', bg: isDark ? '#451A03' : '#FFFBEB' };
      default:
        return { color: '#6366F1', bg: isDark ? '#1E1B4B' : '#EEF2FF' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Officer Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>
              Officer Command & Welfare
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Unit 402 · Capt. Meera Nair (Welfare Officer)
            </Text>
          </View>
          {urgentCount > 0 && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flame" size={13} color="#fff" />
              <Text style={styles.urgentBadgeText}>{urgentCount} URGENT</Text>
            </View>
          )}
        </View>

        {/* Tab Selector: Support & Facility Queue vs Clinical Cases */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? colors.backgroundTertiary : '#F1F5F9' }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'queue' && [styles.tabBtnActive, { backgroundColor: colors.backgroundElement }],
            ]}
            onPress={() => setActiveTab('queue')}
          >
            <Ionicons
              name="construct"
              size={16}
              color={activeTab === 'queue' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'queue' ? colors.primary : colors.textSecondary },
                activeTab === 'queue' && { fontWeight: '800' },
              ]}
            >
              Support & Facility Queue ({queueItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'cases' && [styles.tabBtnActive, { backgroundColor: colors.backgroundElement }],
            ]}
            onPress={() => setActiveTab('cases')}
          >
            <Ionicons
              name="folder-open"
              size={16}
              color={activeTab === 'cases' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'cases' ? colors.primary : colors.textSecondary },
                activeTab === 'cases' && { fontWeight: '800' },
              ]}
            >
              Clinical Cases ({mockCases.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TAB 1: SUPPORT & FACILITY QUEUE ───────────────────────── */}
      {activeTab === 'queue' && (
        <View style={{ flex: 1 }}>
          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterBar, { borderBottomColor: colors.border }]}
            contentContainerStyle={{ paddingHorizontal: Spacing.four, gap: 8, alignItems: 'center' }}
          >
            {[
              { id: 'all', label: 'All Incoming', icon: 'layers' },
              { id: 'facility', label: 'Facility & Accommodation', icon: 'construct' },
              { id: 'callback', label: 'Officer Callbacks', icon: 'call' },
              { id: 'meeting', label: 'Private Meetings', icon: 'shield-checkmark' },
              { id: 'workload', label: 'Workload & Schedule', icon: 'speedometer' },
              { id: 'anonymous', label: '🛡️ Anonymous Reports', icon: 'eye-off' },
            ].map((f) => {
              const active = queueFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.backgroundElement,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setQueueFilter(f.id as any)}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={active ? '#ffffff' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#ffffff' : colors.textSecondary },
                      active && { fontWeight: '700' },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Queue List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ padding: Spacing.four, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {filteredQueue.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Ionicons name="checkmark-done-circle" size={40} color={colors.success} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Queue Clear</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  No support requests or facility hazard reports match the selected filter.
                </Text>
              </View>
            ) : (
              filteredQueue.map((item) => {
                const priorityTheme = getPriorityTheme(item.priority);
                const statusTheme = getStatusTheme(item.status);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.queueCard,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      item.priority === 'urgent' && styles.urgentCardBorder,
                    ]}
                    onPress={() => {
                      setSelectedRequest(item);
                      setOfficerRemark(item.officerNotes || '');
                    }}
                  >
                    {/* Header Row: ID, Priority, Status */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.idGroup}>
                        <Text style={[styles.queueCardId, { color: colors.primary }]}>{item.id}</Text>
                        <View style={[styles.priorityPill, { backgroundColor: priorityTheme.bg }]}>
                          <Text style={[styles.priorityPillText, { color: priorityTheme.color }]}>
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: statusTheme.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusTheme.color }]}>{item.status}</Text>
                      </View>
                    </View>

                    {/* Category Title */}
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {item.categoryTitle}
                      {item.facilityCategory ? ` · ${item.facilityCategory.toUpperCase()}` : ''}
                    </Text>

                    {/* Submitter & Whistleblower Indicator */}
                    <View style={styles.submitterRow}>
                      {item.isAnonymous ? (
                        <View style={[styles.whistleblowerBadge, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                          <Ionicons name="shield-checkmark" size={13} color="#6366F1" />
                          <Text style={styles.whistleblowerText}>PROTECTED WHISTLEBLOWER (ANONYMOUS)</Text>
                        </View>
                      ) : (
                        <View style={styles.soldierBadge}>
                          <Ionicons name="person" size={13} color={colors.textSecondary} />
                          <Text style={[styles.soldierText, { color: colors.text }]}>
                            {item.personName} · {item.unit}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Location if present */}
                    {item.location && (
                      <Text style={[styles.cardLocation, { color: colors.textSecondary }]}>
                        📍 {item.location}
                      </Text>
                    )}

                    {/* Notes preview */}
                    <Text style={[styles.cardNotes, { color: colors.text }]} numberOfLines={2}>
                      {item.notes}
                    </Text>

                    {/* Footer Row: Photo indicator, Time */}
                    <View style={styles.cardFooterRow}>
                      {item.photos && item.photos.length > 0 ? (
                        <View style={styles.photoIndicator}>
                          <Ionicons name="camera" size={14} color="#0284C7" />
                          <Text style={styles.photoIndicatorText}>
                            {item.photos.length} Photo Evidence Attached
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}
                      <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* ── TAB 2: CLINICAL WELFARE CASES ─────────────────────────── */}
      {activeTab === 'cases' && (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: Spacing.four }}>
          {mockCases.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              onPress={() => setSelectedCase(c)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.cardId, { color: colors.textSecondary }]}>{c.id}</Text>
              </View>
              <Text style={[styles.cardReason, { color: colors.textSecondary }]}>{c.reason}</Text>
              <View style={styles.cardFooter}>
                <View style={[styles.badge, { backgroundColor: isDark ? colors.backgroundSelected : Colors.light.backgroundSelected }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{c.status}</Text>
                </View>
                <Text style={[styles.cardDate, { color: colors.textMuted }]}>{c.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── OFFICER ACTION MODAL FOR SUPPORT/FACILITY REQUEST ──────── */}
      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedRequest && (
            <>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                <View>
                  <Text style={[styles.modalId, { color: colors.primary }]}>{selectedRequest.id}</Text>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedRequest.categoryTitle}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRequest(null)} style={{ padding: 6 }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} contentContainerStyle={{ gap: Spacing.four, paddingBottom: 60 }}>
                {/* Whistleblower Mandate Warning */}
                {selectedRequest.isAnonymous && (
                  <View style={[styles.whistleblowerMandateBox, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mandateTitle, { color: isDark ? '#C7D2FE' : '#312E81' }]}>
                        Military Whistleblower Shield Mandate
                      </Text>
                      <Text style={[styles.mandateText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
                        This report was submitted anonymously to prevent retribution or harassment. Officers are strictly prohibited from attempting to de-anonymize or target personnel.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Status & Priority Overview */}
                <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Priority Level</Text>
                    <View style={[styles.priorityPill, { backgroundColor: getPriorityTheme(selectedRequest.priority).bg }]}>
                      <Text style={[styles.priorityPillText, { color: getPriorityTheme(selectedRequest.priority).color }]}>
                        {selectedRequest.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Current Status</Text>
                    <View style={[styles.statusPill, { backgroundColor: getStatusTheme(selectedRequest.status).bg }]}>
                      <Text style={[styles.statusPillText, { color: getStatusTheme(selectedRequest.status).color }]}>
                        {selectedRequest.status}
                      </Text>
                    </View>
                  </View>
                  {selectedRequest.location && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Location</Text>
                      <Text style={[styles.modalVal, { color: colors.text }]}>{selectedRequest.location}</Text>
                    </View>
                  )}
                  {selectedRequest.preferredTimeWindow && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Preferred Callback Time</Text>
                      <Text style={[styles.modalVal, { color: colors.text }]}>{selectedRequest.preferredTimeWindow}</Text>
                    </View>
                  )}
                  {selectedRequest.contactPreference && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Contact Intercom/Phone</Text>
                      <Text style={[styles.modalVal, { color: colors.text }]}>{selectedRequest.contactPreference}</Text>
                    </View>
                  )}
                  {selectedRequest.preferredMeetingLocation && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Preferred Venue</Text>
                      <Text style={[styles.modalVal, { color: colors.text }]}>{selectedRequest.preferredMeetingLocation}</Text>
                    </View>
                  )}
                  {selectedRequest.workloadDetails?.consecutiveDays && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Consecutive Shift Days</Text>
                      <Text style={[styles.modalVal, { color: '#D97706', fontWeight: '800' }]}>
                        {selectedRequest.workloadDetails.consecutiveDays} Days on Duty
                      </Text>
                    </View>
                  )}
                </View>

                {/* Full Description */}
                <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>REPORT DETAILS & HAZARD CONTEXT</Text>
                  <Text style={[styles.bodyText, { color: colors.text }]}>{selectedRequest.notes}</Text>
                </View>

                {/* Evidence Photos */}
                {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                  <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                      PHOTO EVIDENCE ({selectedRequest.photos.length})
                    </Text>
                    <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
                      {selectedRequest.photos.map((p, pIdx) => (
                        <View key={pIdx} style={styles.evidencePhotoContainer}>
                          <Image source={{ uri: p.uri }} style={styles.evidencePhotoImage} resizeMode="cover" />
                          <View style={styles.evidencePhotoMeta}>
                            <Text style={[styles.evidencePhotoName, { color: colors.text }]}>{p.name}</Text>
                            <Text style={[styles.evidencePhotoSize, { color: colors.textSecondary }]}>{p.size || 'Captured'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Officer Resolution & Action Remarks */}
                <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>OFFICER RESOLUTION NOTES</Text>
                  <TextInput
                    style={[
                      styles.officerInput,
                      {
                        backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Enter dispatch notes, MES work order number, or resolution summary..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={officerRemark}
                    onChangeText={setOfficerRemark}
                  />

                  {/* Status Action Buttons */}
                  <View style={styles.actionButtonGroup}>
                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: '#0284C7' }]}
                      onPress={() => handleUpdateStatus('Dispatched')}
                      disabled={updating}
                    >
                      <Ionicons name="construct" size={16} color="#fff" />
                      <Text style={styles.statusActionBtnText}>Dispatch Team / In Progress</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleUpdateStatus('Resolved')}
                      disabled={updating}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#fff" />
                      <Text style={styles.statusActionBtnText}>Mark Resolved & Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── CLINICAL CASE DETAIL MODAL ─────────────────────────────── */}
      <Modal visible={!!selectedCase} animationType="slide" onRequestClose={() => setSelectedCase(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <TouchableOpacity onPress={() => setSelectedCase(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Case {selectedCase?.id}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedCase && (
              <>
                <Text style={[styles.detailName, { color: isDark ? '#F8FAFC' : colors.navy }]}>{selectedCase.name}</Text>
                
                <View style={[styles.stepper, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.stepperTitle, { color: colors.text }]}>Current Stage: {selectedCase.status}</Text>
                  <View style={styles.stepRow}>
                    <View style={[styles.stepDotActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepLineActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepDotActive, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Review</Text>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Intervention</Text>
                    <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Close</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Observed Pattern</Text>
                  <Text style={[styles.textBody, { color: colors.textSecondary }]}>
                    Personnel shows consecutive short sleep periods (&lt; 5h) combined with high subjective workload over the last 14 days.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Possible Contributors</Text>
                  <Text style={[styles.textBody, { color: colors.textSecondary }]}>• Night shift rotation (3 consecutive) {'\n'}• Commute delay reported on check-in</Text>
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Action', 'Navigating to intervention planner')}>
                  <Ionicons name="flask" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Plan Intervention</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.four, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  urgentBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  // Segmented Bar
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: Radius.lg, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: Radius.md, gap: 6 },
  tabBtnActive: { ...Shadow.sm },
  tabBtnText: { fontSize: 12, fontWeight: '600' },

  filterBar: { borderBottomWidth: 1, paddingVertical: 10, maxHeight: 54 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, gap: 6 },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  list: { flex: 1 },
  emptyBox: { padding: Spacing.six, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', margin: Spacing.four },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: Spacing.two },
  emptySub: { fontSize: 12, textAlign: 'center', marginTop: 4, maxWidth: 280 },

  // Queue Cards
  queueCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.three, ...Shadow.sm },
  urgentCardBorder: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  idGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  queueCardId: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  priorityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityPillText: { fontSize: 10, fontWeight: '900' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '800' },

  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  submitterRow: { marginBottom: 6 },
  whistleblowerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  whistleblowerText: { color: '#6366F1', fontSize: 10, fontWeight: '800' },
  soldierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  soldierText: { fontSize: 12, fontWeight: '600' },
  cardLocation: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardNotes: { fontSize: 13, lineHeight: 18, marginBottom: 8 },

  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.15)', paddingTop: 6 },
  photoIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoIndicatorText: { fontSize: 11, color: '#0284C7', fontWeight: '700' },
  cardTime: { fontSize: 11 },

  // Clinical Cases cards
  card: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardId: { fontSize: 13 },
  cardReason: { fontSize: 14, marginBottom: Spacing.three },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardDate: { fontSize: 12 },

  // Officer Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1 },
  modalId: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  modalTitle: { fontSize: 17, fontWeight: '800', marginTop: 1 },
  modalContent: { padding: Spacing.four },

  whistleblowerMandateBox: { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1.5, gap: Spacing.three },
  mandateTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  mandateText: { fontSize: 11, lineHeight: 16 },

  modalCard: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.three },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { fontSize: 13 },
  modalVal: { fontSize: 13, fontWeight: '700' },
  sectionHeading: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  bodyText: { fontSize: 14, lineHeight: 20 },

  evidencePhotoContainer: { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  evidencePhotoImage: { width: '100%', height: 180 },
  evidencePhotoMeta: { padding: Spacing.two, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.4)' },
  evidencePhotoName: { fontSize: 12, fontWeight: '700', color: '#fff' },
  evidencePhotoSize: { fontSize: 11, color: '#e2e8f0' },

  officerInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, fontSize: 13, minHeight: 70, textAlignVertical: 'top' },
  actionButtonGroup: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  statusActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: Radius.md, gap: 6 },
  statusActionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  // Clinical modal styles
  detailName: { fontSize: 24, fontWeight: 'bold', marginBottom: Spacing.six },
  stepper: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, borderWidth: 1 },
  stepperTitle: { fontWeight: 'bold', marginBottom: Spacing.four },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
  stepDotActive: { width: 12, height: 12, borderRadius: 6 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLineActive: { flex: 1, height: 2 },
  stepLine: { flex: 1, height: 2 },
  stepLabel: { fontSize: 11 },
  section: { marginBottom: Spacing.six },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Spacing.two },
  textBody: { fontSize: 15, lineHeight: 22 },
  actionBtn: { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.four },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
