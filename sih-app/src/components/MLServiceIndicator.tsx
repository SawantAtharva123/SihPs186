import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, Shadow } from '@/constants/theme';

export default function MLServiceIndicator() {
  const { mlStatus, mlDetails, isManualOffline, setIsOffline, pingMLService } = useSahayak();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [pinging, setPinging] = useState(false);

  const handleManualPing = async () => {
    setPinging(true);
    try {
      await pingMLService();
    } finally {
      setPinging(false);
    }
  };

  const getStatusConfig = () => {
    switch (mlStatus) {
      case 'live':
        return {
          label: 'Live',
          badgeText: 'ML Live',
          icon: 'radio-button-on' as const,
          color: '#10B981',
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          border: isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0',
          title: 'ML Service Online',
          desc: 'FastAPI analytics engine is active and serving multi-modal predictions in real-time.',
        };
      case 'offline':
        return {
          label: 'Offline',
          badgeText: 'Offline',
          icon: 'cloud-offline' as const,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
          border: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
          title: 'Offline Mode Active',
          desc: isManualOffline
            ? 'Manual field offline mode is active. Encrypted local SQLite storage is saving all check-ins and notes.'
            : 'No active internet connection detected on this device. Actions are safely queued locally.',
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          badgeText: 'Disconnected',
          icon: 'alert-circle' as const,
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          border: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
          title: 'ML Service Disconnected',
          desc: 'Unable to reach the deployed ML server. Zero-undercounting local inference is actively safeguarding personnel.',
        };
      case 'checking':
      default:
        return {
          label: 'Checking...',
          badgeText: 'Checking...',
          icon: 'sync-outline' as const,
          color: '#64748B',
          bg: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
          border: isDark ? 'rgba(100, 116, 139, 0.4)' : '#E2E8F0',
          title: 'Checking ML Service...',
          desc: 'Pinging cloud server health endpoint to verify connectivity.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.indicatorPill,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`ML service status: ${config.label}. Tap for details.`}
      >
        {mlStatus === 'checking' ? (
          <ActivityIndicator size="small" color={config.color} style={styles.spinner} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        )}
        <Ionicons name={config.icon} size={13} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.badgeText}
        </Text>
      </TouchableOpacity>

      {/* Connectivity & Diagnostic Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View
                  style={[
                    styles.modalIconWrap,
                    { backgroundColor: config.bg, borderColor: config.border },
                  ]}
                >
                  <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : colors.navy }]}>
                    {config.title}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Intelligence & Server Diagnostics
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={[styles.modalDesc, { color: colors.text }]}>
              {config.desc}
            </Text>

            {/* Info Metrics Box */}
            <View
              style={[
                styles.metricsBox,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Server Endpoint:
                </Text>
                <Text
                  style={[styles.metricValue, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {mlDetails.serviceUrl}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Ping Latency:
                </Text>
                <Text style={[styles.metricValue, { color: config.color, fontWeight: '700' }]}>
                  {mlDetails.latencyMs !== null ? `${mlDetails.latencyMs} ms` : 'N/A'}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Inference Mode:
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {mlStatus === 'live'
                    ? 'Cloud Multi-Modal Model'
                    : 'Local Safe Fallback Engine'}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Last Checked:
                </Text>
                <Text style={[styles.metricValue, { color: colors.textMuted }]}>
                  {mlDetails.lastChecked
                    ? mlDetails.lastChecked.toLocaleTimeString()
                    : 'Not checked yet'}
                </Text>
              </View>

              {mlDetails.error ? (
                <View style={[styles.errorBox, { backgroundColor: isDark ? '#451A03' : '#FEF2F2' }]}>
                  <Ionicons name="information-circle" size={14} color="#EF4444" />
                  <Text style={[styles.errorText, { color: '#EF4444' }]} numberOfLines={2}>
                    {mlDetails.error}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.pingBtn,
                  { backgroundColor: colors.primary },
                  pinging && { opacity: 0.7 },
                ]}
                onPress={handleManualPing}
                disabled={pinging}
              >
                {pinging ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.pingBtnText}>Ping Service Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.offlineToggleBtn,
                  {
                    backgroundColor: isManualOffline
                      ? (isDark ? '#451A03' : '#FFFBEB')
                      : (isDark ? '#1E293B' : '#F1F5F9'),
                    borderColor: isManualOffline ? '#F59E0B' : colors.border,
                  },
                ]}
                onPress={() => setIsOffline(!isManualOffline)}
              >
                <Ionicons
                  name={isManualOffline ? 'cloud-done' : 'cloud-offline'}
                  size={15}
                  color={isManualOffline ? '#F59E0B' : colors.text}
                />
                <Text
                  style={[
                    styles.offlineToggleText,
                    { color: isManualOffline ? '#F59E0B' : colors.text },
                  ]}
                >
                  {isManualOffline ? 'Turn Offline Mode Off' : 'Simulate Offline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spinner: {
    width: 10,
    height: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    borderWidth: 1,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  metricsBox: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 8,
    marginBottom: Spacing.four,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '65%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    flex: 1,
    fontWeight: '500',
  },
  actionRow: {
    gap: Spacing.two,
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  pingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  offlineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  offlineToggleText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
