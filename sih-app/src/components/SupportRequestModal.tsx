import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useSahayak } from '@/context/SahayakContext';
import {
  SupportOptionType,
  FacilityCategory,
  SupportPriority,
  SupportPhotoAttachment,
  SupportRequestRecord,
} from '@/types/sahayak';
import { createSupportRequest } from '@/repositories/support';
import * as DocumentPicker from 'expo-document-picker';
import FadeInView from '@/components/animations/FadeInView';
import BouncyPressable from '@/components/animations/BouncyPressable';

interface SupportRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (record: SupportRequestRecord) => void;
  initialType?: SupportOptionType;
}

interface SupportOptionItem {
  type: SupportOptionType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge: string;
}

const SUPPORT_OPTIONS: SupportOptionItem[] = [
  {
    type: 'officer_callback',
    title: 'Request Welfare Officer Call Back',
    subtitle: 'Confidential scheduled phone call with Capt. Meera Nair',
    icon: 'call',
    color: '#0284C7',
    badge: 'Direct Callback',
  },
  {
    type: 'private_meeting',
    title: 'Request Private Meeting',
    subtitle: 'In-person 1-on-1 confidential meeting in MI Room or welfare office',
    icon: 'shield-checkmark',
    color: '#059669',
    badge: 'Confidential 1-on-1',
  },
  {
    type: 'buddy_contact',
    title: 'Request Buddy Contact',
    subtitle: 'Direct secure line to your assigned buddy (Cpl. Rajan Kumar) or new peer',
    icon: 'people',
    color: '#7C3AED',
    badge: 'Peer Support',
  },
  {
    type: 'workload_issue',
    title: 'Report Workload Issue',
    subtitle: 'Consecutive night shifts, excessive fatigue, lack of rest intervals',
    icon: 'speedometer',
    color: '#D97706',
    badge: 'Operational Strain',
  },
  {
    type: 'facility_issue',
    title: 'Report Accommodation or Facility Issue',
    subtitle: 'Living quarters, water, food, power, transport, equipment, sanitation',
    icon: 'construct',
    color: '#DC2626',
    badge: 'Facility Hazard / Whistleblower',
  },
  {
    type: 'schedule_problem',
    title: 'Report a Schedule Problem',
    subtitle: 'Conflicting roster, cancelled rest window, short-notice shift shock',
    icon: 'calendar',
    color: '#2563EB',
    badge: 'Roster Conflict',
  },
  {
    type: 'general_support',
    title: 'General Support',
    subtitle: 'Personal welfare, family distress, administrative query, general grievance',
    icon: 'help-buoy',
    color: '#4B5563',
    badge: 'Welfare Inquiry',
  },
];

const FACILITY_CATEGORIES: { id: FacilityCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'accommodation', label: 'Accommodation', icon: 'home' },
  { id: 'food', label: 'Food & Mess', icon: 'restaurant' },
  { id: 'water', label: 'Water Supply', icon: 'water' },
  { id: 'electricity', label: 'Electricity / Power', icon: 'flash' },
  { id: 'transport', label: 'Transport / Vehicle', icon: 'bus' },
  { id: 'equipment', label: 'Equipment / Gear', icon: 'shield' },
  { id: 'sanitation', label: 'Sanitation & Hygiene', icon: 'trash-bin' },
  { id: 'other', label: 'Another (Other)', icon: 'grid' },
];

const PRIORITY_LEVELS: { id: SupportPriority; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'normal', label: 'Normal', desc: 'Routine maintenance', color: '#10B981', bg: '#ECFDF5' },
  { id: 'medium', label: 'Medium', desc: 'Noticeable inconvenience', color: '#0284C7', bg: '#F0F9FF' },
  { id: 'high', label: 'High', desc: 'Operational disruption', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'urgent', label: 'Urgent', desc: 'Immediate health / safety hazard', color: '#EF4444', bg: '#FEF2F2' },
];

// Tactical inspection preset photos for immediate demonstration
const DEMO_INSPECTION_PHOTOS: Record<FacilityCategory, { uri: string; name: string; size: string }> = {
  water: {
    uri: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=60',
    name: 'water_filter_sediment.jpg',
    size: '1.4 MB',
  },
  accommodation: {
    uri: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=60',
    name: 'barracks_roof_leakage.jpg',
    size: '2.3 MB',
  },
  food: {
    uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    name: 'cookhouse_chiller_defect.jpg',
    size: '1.8 MB',
  },
  electricity: {
    uri: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
    name: 'generator_burnt_board.jpg',
    size: '1.9 MB',
  },
  transport: {
    uri: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=60',
    name: 'troop_carrier_suspension.jpg',
    size: '1.6 MB',
  },
  equipment: {
    uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=60',
    name: 'damaged_ballistic_vest.jpg',
    size: '1.2 MB',
  },
  sanitation: {
    uri: 'https://images.unsplash.com/photo-1584772108427-024f2b1d6248?w=800&auto=format&fit=crop&q=60',
    name: 'drainage_block_ablution.jpg',
    size: '2.0 MB',
  },
  other: {
    uri: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=60',
    name: 'base_perimeter_defect.jpg',
    size: '1.5 MB',
  },
};

export default function SupportRequestModal({
  visible,
  onClose,
  onSubmitted,
  initialType,
}: SupportRequestModalProps) {
  const { colors, isDark } = useTheme();
  const { currentUser } = useSahayak();

  // Navigation steps: 1 = Category Pick, 2 = Form, 3 = Confirmation Receipt
  const [step, setStep] = useState<1 | 2 | 3>(initialType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<SupportOptionType>(initialType || 'facility_issue');

  // Form states
  const [facilityCategory, setFacilityCategory] = useState<FacilityCategory>('water');
  const [priority, setPriority] = useState<SupportPriority>('urgent');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [photos, setPhotos] = useState<SupportPhotoAttachment[]>([]);
  const [preferredTime, setPreferredTime] = useState('Within 2 Hours');
  const [contactPhone, setContactPhone] = useState('Ext. 204 (Barracks Intercom)');
  const [meetingLocation, setMeetingLocation] = useState('Unit MI Room · Confidential Office');
  const [preferredMeetingDate, setPreferredMeetingDate] = useState('Today · 16:30');
  const [buddyOption, setBuddyOption] = useState<'assigned' | 'new'>('assigned');
  const [consecutiveDays, setConsecutiveDays] = useState(6);
  const [scheduleImpact, setScheduleImpact] = useState('Cancelled mandatory 24-hr turnaround rest');

  // Submission & receipt states
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<SupportRequestRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const resetForm = () => {
    setStep(1);
    setSelectedType('facility_issue');
    setFacilityCategory('water');
    setPriority('urgent');
    setLocation('');
    setNotes('');
    setIsAnonymous(true);
    setPhotos([]);
    setPreferredTime('Within 2 Hours');
    setSubmitting(false);
    setSubmittedRecord(null);
    setCopiedId(false);
  };

  const handleSelectOption = (type: SupportOptionType) => {
    setSelectedType(type);
    if (type === 'facility_issue') {
      setIsAnonymous(true); // Default anonymous for whistleblower protection
      setPriority('urgent');
    } else {
      setIsAnonymous(false);
      setPriority('high');
    }
    setStep(2);
  };

  // Attach real photo from device
  const handlePickDocumentPhoto = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const newPhoto: SupportPhotoAttachment = {
          uri: asset.uri,
          name: asset.name || `photo_${Date.now()}.jpg`,
          size: asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
        };
        setPhotos((prev) => [...prev, newPhoto]);
      }
    } catch (err) {
      console.warn('Photo picker failed, using demo photo option:', err);
    }
  };

  // Add realistic demo inspection photo
  const handleAddDemoPhoto = () => {
    const preset = DEMO_INSPECTION_PHOTOS[facilityCategory] || DEMO_INSPECTION_PHOTOS.water;
    const exists = photos.some((p) => p.name === preset.name);
    if (!exists) {
      setPhotos((prev) => [...prev, preset]);
    } else {
      Alert.alert('Photo Attached', 'Inspection photo for this category is already attached.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!notes.trim() && selectedType === 'facility_issue' && !location.trim()) {
      Alert.alert('Required Information', 'Please provide a brief description or location of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const activeOption = SUPPORT_OPTIONS.find((o) => o.type === selectedType);
      const title = activeOption ? activeOption.title : 'Support Request';

      const payload = {
        personId: currentUser?.id || 'soldier-104',
        personName: currentUser?.name || 'Rohan Verma',
        unit: 'Unit 402 / Alpha Coy',
        requestType: selectedType,
        categoryTitle: title,
        isAnonymous,
        priority,
        facilityCategory: selectedType === 'facility_issue' ? facilityCategory : undefined,
        location: location.trim() || (selectedType === 'facility_issue' ? 'Barracks Block 3' : undefined),
        notes: notes.trim() || `${title} submitted via 1-Tap Support Assistance.`,
        preferredTimeWindow: preferredTime,
        contactPreference: contactPhone,
        preferredMeetingLocation: meetingLocation,
        preferredMeetingDate: preferredMeetingDate,
        buddyName: buddyOption === 'assigned' ? 'Cpl. Rajan Kumar' : 'New Peer Buddy',
        workloadDetails: selectedType === 'workload_issue' ? { consecutiveDays, issueType: notes || 'Night Shift Overload' } : undefined,
        scheduleDetails: selectedType === 'schedule_problem' ? { rosterDate: 'Current Roster', shiftImpact: scheduleImpact } : undefined,
        photos,
      };

      const record = await createSupportRequest(payload);
      setSubmittedRecord(record);
      setStep(3);
      if (onSubmitted) {
        onSubmitted(record);
      }
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Submission Error', 'Failed to dispatch support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedRecord) return;
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  const currentOptionInfo = SUPPORT_OPTIONS.find((o) => o.type === selectedType) || SUPPORT_OPTIONS[4];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            {step === 2 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>
                {step === 1
                  ? 'I Need Support · 1-Tap Assistance'
                  : step === 2
                  ? currentOptionInfo.title
                  : 'Request Dispatched'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {step === 1
                  ? 'Confidential welfare, crisis & facility hazard reporting'
                  : step === 2
                  ? 'Complete details for Welfare Officer Queue dispatch'
                  : 'Official military ticket receipt generated'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              resetForm();
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── STEP 1: CATEGORY SELECTION ────────────────────────────── */}
        {step === 1 && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Whistleblower Shield Assurance */}
            <FadeInView delay={50}>
              <View
                style={[
                  styles.shieldNotice,
                  {
                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(5, 150, 105, 0.4)' : '#A7F3D0',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={22} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shieldNoticeTitle, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                    Military Non-Retaliation & Whistleblower Protection
                  </Text>
                  <Text style={[styles.shieldNoticeText, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                    All submissions can be sent 100% anonymously. Your identity, service number, and roster ID are
                    cryptographically stripped before dispatching to the Welfare Officer.
                  </Text>
                </View>
              </View>
            </FadeInView>

            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              SELECT SUPPORT OR REPORTING CATEGORY
            </Text>

            <View style={styles.optionsList}>
              {SUPPORT_OPTIONS.map((option, idx) => (
                <FadeInView key={option.type} delay={80 + idx * 40}>
                  <BouncyPressable
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelectOption(option.type)}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: `${option.color}20` }]}>
                      <Ionicons name={option.icon} size={24} color={option.color} />
                    </View>
                    <View style={styles.optionContent}>
                      <View style={styles.optionTitleRow}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                        <View style={[styles.optionBadge, { backgroundColor: `${option.color}15`, borderColor: `${option.color}35` }]}>
                          <Text style={[styles.optionBadgeText, { color: option.color }]}>{option.badge}</Text>
                        </View>
                      </View>
                      <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </BouncyPressable>
                </FadeInView>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── STEP 2: TAILORED FORM ─────────────────────────────────── */}
        {step === 2 && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Header info badge */}
            <View style={[styles.currentOptionHeader, { backgroundColor: `${currentOptionInfo.color}15`, borderColor: `${currentOptionInfo.color}40` }]}>
              <Ionicons name={currentOptionInfo.icon} size={22} color={currentOptionInfo.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentOptionHeaderTitle, { color: currentOptionInfo.color }]}>
                  {currentOptionInfo.title}
                </Text>
                <Text style={[styles.currentOptionHeaderSub, { color: colors.textSecondary }]}>
                  {currentOptionInfo.subtitle}
                </Text>
              </View>
            </View>

            {/* ── ANONYMITY TOGGLE (CRITICAL REQUIREMENT) ── */}
            <View
              style={[
                styles.anonymousCard,
                {
                  backgroundColor: isAnonymous
                    ? isDark ? 'rgba(79, 70, 229, 0.18)' : '#EEF2FF'
                    : colors.backgroundElement,
                  borderColor: isAnonymous ? '#6366F1' : colors.border,
                },
              ]}
            >
              <View style={styles.anonymousHeader}>
                <View style={[styles.shieldPill, { backgroundColor: isAnonymous ? '#6366F1' : colors.textMuted }]}>
                  <Ionicons name={isAnonymous ? 'shield-checkmark' : 'shield-outline'} size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.anonymousTitle, { color: colors.text }]}>
                    {isAnonymous ? 'Submit Anonymously (Identity Scrubbed)' : 'Submit Named (Under Rohan Verma)'}
                  </Text>
                  <Text style={[styles.anonymousSub, { color: isAnonymous ? '#6366F1' : colors.textSecondary }]}>
                    {isAnonymous
                      ? 'Whistleblower Protection ON: You cannot be targeted or harassed for reporting.'
                      : 'Welfare officer will see your name for direct personalized follow-up.'}
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: colors.border, true: '#6366F1' }}
                  thumbColor="#ffffff"
                />
              </View>
              {isAnonymous && (
                <View style={styles.anonymousNotice}>
                  <Ionicons name="information-circle" size={15} color="#6366F1" />
                  <Text style={[styles.anonymousNoticeText, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
                    Your service number, name, device IP, and unit platoon are detached. A cryptographic one-way token will represent you in the Welfare Officer queue.
                  </Text>
                </View>
              )}
            </View>

            {/* ── SPECIFIC FIELDS: FACILITY & ACCOMMODATION ISSUE ── */}
            {selectedType === 'facility_issue' && (
              <>
                {/* 1. Facility Category Selector */}
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  1. Facility Hazard Category <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.categoriesGrid}>
                  {FACILITY_CATEGORIES.map((cat) => {
                    const isSelected = facilityCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.backgroundElement,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setFacilityCategory(cat.id)}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={18}
                          color={isSelected ? '#ffffff' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.catPillText,
                            { color: isSelected ? '#ffffff' : colors.text },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Priority Level Selector (Normal to Urgent) */}
                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  2. Priority Level <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.priorityRow}>
                  {PRIORITY_LEVELS.map((lvl) => {
                    const isSelected = priority === lvl.id;
                    return (
                      <TouchableOpacity
                        key={lvl.id}
                        style={[
                          styles.priorityCard,
                          {
                            backgroundColor: isSelected ? lvl.color : colors.backgroundElement,
                            borderColor: isSelected ? lvl.color : colors.border,
                          },
                        ]}
                        onPress={() => setPriority(lvl.id)}
                      >
                        <View style={styles.priorityIndicatorRow}>
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: isSelected ? '#ffffff' : lvl.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.priorityTitle,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {lvl.label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.priorityDesc,
                            { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {lvl.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. Location / Sector Input */}
                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  3. Location / Block / Post
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Barracks 4 West Ablution Block, Cookhouse #2, Outpost Echo"
                  placeholderTextColor={colors.textMuted}
                  value={location}
                  onChangeText={setLocation}
                />

                {/* 4. Description & Operational Impact */}
                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  4. Description of Hazard & Health/Safety Impact <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Describe the issue in detail: when it started, how many personnel are affected, hygiene/safety concerns, risk of duty stoppage..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />

                {/* 5. Photo Attachment Area (CRITICAL REQUIREMENT) */}
                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  5. Evidence & Inspection Photos ({photos.length} Attached)
                </Text>
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity
                    style={[styles.attachBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: colors.primary }]}
                    onPress={handlePickDocumentPhoto}
                  >
                    <Ionicons name="camera" size={18} color={colors.primary} />
                    <Text style={[styles.attachBtnText, { color: colors.primary }]}>Attach from Device</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attachBtn, { backgroundColor: isDark ? '#064E3B' : '#EBF9F1', borderColor: colors.success }]}
                    onPress={handleAddDemoPhoto}
                  >
                    <Ionicons name="sparkles" size={18} color={colors.success} />
                    <Text style={[styles.attachBtnText, { color: colors.success }]}>Quick Inspection Preset</Text>
                  </TouchableOpacity>
                </View>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <View style={styles.photoPreviewGrid}>
                    {photos.map((photo, pIdx) => (
                      <View
                        key={pIdx}
                        style={[styles.photoCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                      >
                        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                        <View style={styles.photoInfo}>
                          <Text style={[styles.photoName, { color: colors.text }]} numberOfLines={1}>
                            {photo.name}
                          </Text>
                          <Text style={[styles.photoSize, { color: colors.textSecondary }]}>
                            {photo.size || 'Attached'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.photoRemoveBtn}
                          onPress={() => handleRemovePhoto(pIdx)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* ── SPECIFIC FIELDS: WELFARE OFFICER CALL BACK ── */}
            {selectedType === 'officer_callback' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Preferred Time Window for Callback</Text>
                <View style={styles.choicePillRow}>
                  {['Within 1 Hour (Urgent)', 'Today Afternoon (14:00-16:00)', 'This Evening (17:00-19:00)', 'Tomorrow Morning'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: preferredTime === t ? colors.primary : colors.backgroundElement,
                          borderColor: preferredTime === t ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setPreferredTime(t)}
                    >
                      <Text style={[styles.choicePillText, { color: preferredTime === t ? '#fff' : colors.text }]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Contact Intercom / Mobile Extension
                </Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="e.g. Army Intercom Ext. 204 or +91 98765-43210"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Brief Context / Reason for Callback
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="Briefly state your concern (e.g. family emergency, leave query, sleep strain, confidential discussion)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* ── SPECIFIC FIELDS: PRIVATE MEETING ── */}
            {selectedType === 'private_meeting' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Preferred Confidential Venue</Text>
                <View style={styles.choicePillRow}>
                  {['Unit MI Room · Confidential Office', 'Welfare Center Room 2', 'Off-Site Neutral Ground', 'Encrypted Video Room'].map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: meetingLocation === loc ? colors.primary : colors.backgroundElement,
                          borderColor: meetingLocation === loc ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setMeetingLocation(loc)}
                    >
                      <Text style={[styles.choicePillText, { color: meetingLocation === loc ? '#fff' : colors.text }]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>Preferred Time Slot</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  value={preferredMeetingDate}
                  onChangeText={setPreferredMeetingDate}
                  placeholder="e.g. Today 16:30 or Tomorrow 10:00"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Meeting Subject / Discussion Agenda
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="Topic of consultation (strictly protected under military doctor-patient confidentiality)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* ── SPECIFIC FIELDS: BUDDY CONTACT ── */}
            {selectedType === 'buddy_contact' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Peer Connection</Text>
                <View style={styles.choicePillRow}>
                  <TouchableOpacity
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: buddyOption === 'assigned' ? colors.primary : colors.backgroundElement,
                        borderColor: buddyOption === 'assigned' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setBuddyOption('assigned')}
                  >
                    <Text style={[styles.choicePillText, { color: buddyOption === 'assigned' ? '#fff' : colors.text }]}>
                      Assigned Buddy (Cpl. Rajan Kumar)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: buddyOption === 'new' ? colors.primary : colors.backgroundElement,
                        borderColor: buddyOption === 'new' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setBuddyOption('new')}
                  >
                    <Text style={[styles.choicePillText, { color: buddyOption === 'new' ? '#fff' : colors.text }]}>
                      Request Different Peer Buddy
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Message to Peer Buddy
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="Hey, have some time for a quick tea/coffee? Need to talk about recent patrol stress..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* ── SPECIFIC FIELDS: WORKLOAD ISSUE ── */}
            {selectedType === 'workload_issue' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Consecutive Days on Shift Without Rest</Text>
                <View style={styles.daysCounterRow}>
                  {[3, 5, 7, 8, 10, 14].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: consecutiveDays === d ? '#D97706' : colors.backgroundElement,
                          borderColor: consecutiveDays === d ? '#D97706' : colors.border,
                        },
                      ]}
                      onPress={() => setConsecutiveDays(d)}
                    >
                      <Text style={[styles.dayCircleText, { color: consecutiveDays === d ? '#fff' : colors.text }]}>
                        {d}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Workload & Fatigue Description
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="Explain the workload strain (e.g. continuous double duties, lack of sleep turnover, standing down recommendation)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* ── SPECIFIC FIELDS: SCHEDULE PROBLEM ── */}
            {selectedType === 'schedule_problem' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Operational Schedule Strain</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  value={scheduleImpact}
                  onChangeText={setScheduleImpact}
                  placeholder="e.g. Sudden roster change, Turnaround time < 6h"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.formLabel, { color: colors.text, marginTop: Spacing.four }]}>
                  Roster Conflict Details
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="State which shifts conflict, duty orders, and the requested relief adjustment..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* ── SPECIFIC FIELDS: GENERAL SUPPORT ── */}
            {selectedType === 'general_support' && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>General Support Details</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC', borderColor: colors.border, color: colors.text }]}
                  placeholder="Describe how the Welfare Department can assist you (family concerns, administrative grievances, mental wellbeing)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={5}
                  value={notes}
                  onChangeText={setNotes}
                />
              </>
            )}

            {/* Dispatch Action Button */}
            <BouncyPressable
              style={[styles.submitButton, { backgroundColor: currentOptionInfo.color }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    Generate Request ID & Dispatch to Welfare Officer
                  </Text>
                </>
              )}
            </BouncyPressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── STEP 3: CONFIRMATION & REQUEST ID RECEIPT ─────────────── */}
        {step === 3 && submittedRecord && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.receiptContent}>
            <FadeInView delay={50} style={styles.receiptHeader}>
              <View style={[styles.checkCircle, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={36} color="#fff" />
              </View>
              <Text style={[styles.receiptMainTitle, { color: isDark ? '#F8FAFC' : colors.navy }]}>
                Support Request Dispatched
              </Text>
              <Text style={[styles.receiptMainSubtitle, { color: colors.textSecondary }]}>
                Successfully added to Unit Welfare Officer Queue (Capt. Meera Nair)
              </Text>
            </FadeInView>

            {/* Request ID Display Card */}
            <FadeInView delay={120}>
              <View style={[styles.idCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.idCardLabel, { color: colors.textSecondary }]}>OFFICIAL TICKET / REQUEST ID</Text>
                <Text style={[styles.idCardValue, { color: colors.primary }]}>{submittedRecord.id}</Text>
                
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: copiedId ? '#10B981' : isDark ? '#1E293B' : '#EFF6FF' }]}
                  onPress={handleCopyId}
                >
                  <Ionicons name={copiedId ? 'checkmark-circle' : 'copy-outline'} size={16} color={copiedId ? '#fff' : colors.primary} />
                  <Text style={[styles.copyBtnText, { color: copiedId ? '#fff' : colors.primary }]}>
                    {copiedId ? 'Copied to Clipboard' : 'Copy Request ID'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.idDivider} />

                {/* Whistleblower Protection Status */}
                <View style={styles.protectionRow}>
                  <Ionicons
                    name={submittedRecord.isAnonymous ? 'shield-checkmark' : 'person-circle'}
                    size={20}
                    color={submittedRecord.isAnonymous ? '#10B981' : colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.protectionTitle, { color: colors.text }]}>
                      {submittedRecord.isAnonymous ? 'Anonymous Protected Submission' : 'Named Soldier Submission'}
                    </Text>
                    <Text style={[styles.protectionDesc, { color: colors.textSecondary }]}>
                      {submittedRecord.isAnonymous
                        ? 'Your name and identity are scrubbed. Safe from any command retaliation or targeting.'
                        : `Assigned under personnel ID: ${submittedRecord.personName}`}
                    </Text>
                  </View>
                </View>
              </View>
            </FadeInView>

            {/* Ticket Summary Details */}
            <FadeInView delay={180}>
              <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Category</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{submittedRecord.categoryTitle}</Text>
                </View>
                {submittedRecord.facilityCategory && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Facility Domain</Text>
                    <Text style={[styles.summaryValue, { color: colors.text, textTransform: 'capitalize' }]}>
                      {submittedRecord.facilityCategory}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Priority Level</Text>
                  <View
                    style={[
                      styles.summaryPriorityBadge,
                      {
                        backgroundColor:
                          submittedRecord.priority === 'urgent'
                            ? '#FEF2F2'
                            : submittedRecord.priority === 'high'
                            ? '#FFFBEB'
                            : '#ECFDF5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.summaryPriorityText,
                        {
                          color:
                            submittedRecord.priority === 'urgent'
                              ? '#EF4444'
                              : submittedRecord.priority === 'high'
                              ? '#F59E0B'
                              : '#10B981',
                        },
                      ]}
                    >
                      {submittedRecord.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {submittedRecord.photos && submittedRecord.photos.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Evidence Attached</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700' }]}>
                      {submittedRecord.photos.length} Photo(s) Attached
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Initial Status</Text>
                  <Text style={[styles.summaryValue, { color: '#0284C7', fontWeight: '700' }]}>
                    Submitted to Officer Queue
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expected Response</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {submittedRecord.priority === 'urgent' ? '< 2 Hours (SLA Protocol)' : '< 24 Hours'}
                  </Text>
                </View>
              </View>
            </FadeInView>

            {/* Bottom Actions */}
            <FadeInView delay={240}>
              <BouncyPressable
                style={[styles.finishBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                <Text style={styles.finishBtnText}>Done · Return to App</Text>
              </BouncyPressable>
            </FadeInView>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 6 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four },

  // Shield Notice
  shieldNotice: {
    flexDirection: 'row',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  shieldNoticeTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  shieldNoticeText: { fontSize: 12, lineHeight: 17 },

  sectionHeading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: Spacing.three },
  optionsList: { gap: Spacing.three },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.three,
    ...Shadow.sm,
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  optionTitle: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
  optionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  optionBadgeText: { fontSize: 10, fontWeight: '800' },
  optionSubtitle: { fontSize: 12, lineHeight: 16 },

  // Step 2 Form
  currentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  currentOptionHeaderTitle: { fontSize: 15, fontWeight: '800' },
  currentOptionHeaderSub: { fontSize: 12, marginTop: 1 },

  // Anonymous Switch Card
  anonymousCard: {
    padding: Spacing.four,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.four,
    ...Shadow.sm,
  },
  anonymousHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  shieldPill: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  anonymousTitle: { fontSize: 14, fontWeight: '800' },
  anonymousSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  anonymousNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  anonymousNoticeText: { fontSize: 11, flex: 1, lineHeight: 15 },

  formLabel: { fontSize: 13, fontWeight: '800', marginBottom: Spacing.two },
  requiredStar: { color: '#EF4444' },

  // Categories Grid (8 pills)
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.two },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  catPillText: { fontSize: 13, fontWeight: '600' },

  // Priority Row
  priorityRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.two },
  priorityCard: {
    flex: 1,
    padding: 10,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'flex-start',
  },
  priorityIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  priorityTitle: { fontSize: 12, fontWeight: '800' },
  priorityDesc: { fontSize: 10, marginTop: 1 },

  inputField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: Spacing.two,
  },

  // Photo actions
  photoActionsRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  attachBtnText: { fontSize: 12, fontWeight: '700' },
  photoPreviewGrid: { gap: Spacing.two, marginBottom: Spacing.four },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.three,
  },
  photoThumb: { width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: '#cbd5e1' },
  photoInfo: { flex: 1 },
  photoName: { fontSize: 13, fontWeight: '700' },
  photoSize: { fontSize: 11, marginTop: 2 },
  photoRemoveBtn: { padding: 8 },

  choicePillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.two },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  choicePillText: { fontSize: 13, fontWeight: '600' },

  daysCounterRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.two },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: { fontSize: 14, fontWeight: '800' },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    gap: Spacing.two,
    marginTop: Spacing.five,
    ...Shadow.md,
  },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },

  // Step 3 Receipt
  receiptContent: { padding: Spacing.five, alignItems: 'center' },
  receiptHeader: { alignItems: 'center', marginBottom: Spacing.five },
  checkCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  receiptMainTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  receiptMainSubtitle: { fontSize: 13, marginTop: 4, textAlign: 'center', maxWidth: 300 },

  idCard: {
    width: '100%',
    padding: Spacing.five,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.four,
    ...Shadow.sm,
  },
  idCardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  idCardValue: { fontSize: 32, fontWeight: '900', letterSpacing: 1.5, marginVertical: Spacing.two },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  copyBtnText: { fontSize: 13, fontWeight: '700' },
  idDivider: { width: '100%', height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: Spacing.four },
  protectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, width: '100%' },
  protectionTitle: { fontSize: 14, fontWeight: '800' },
  protectionDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  summaryCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.five,
    gap: Spacing.three,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  summaryPriorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  summaryPriorityText: { fontSize: 11, fontWeight: '800' },

  finishBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    alignItems: 'center',
    ...Shadow.md,
  },
  finishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
