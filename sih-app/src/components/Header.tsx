import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSahayak } from '@/context/SahayakContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggleBtn from '@/components/animations/ThemeToggleBtn';
import MLServiceIndicator from '@/components/MLServiceIndicator';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { UserRole } from '@/types/sahayak';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout as authLogout } from '@/services/auth';

export default function Header() {
  const { role, isOffline, setIsOffline, currentUser, setCurrentUser, setRole, mlStatus } = useSahayak();
  const { colors, isDark } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  const getRoleInfo = (r: UserRole) => {
    switch (r) {
      case 'personnel':        return { title: 'Personnel', icon: 'person',   color: colors.primary };
      case 'welfare_officer':  return { title: 'Welfare',   icon: 'medical',  color: colors.accent };
      case 'command_admin':    return { title: 'Command',   icon: 'business', color: colors.stateSustained };
      default:                 return { title: 'Unknown',   icon: 'help',     color: colors.textSecondary };
    }
  };

  const currentRoleInfo = getRoleInfo(role);

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (_) {}
    setCurrentUser(null);
    setRole('personnel');
    router.replace('/(auth)/login');
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        'Log Out',
        `Are you sure you want to log out${currentUser ? `, ${currentUser.name}` : ''}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: handleLogout },
        ],
      );
    }
  };

  return (
    <>
      <SafeAreaView
        edges={['top']}
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View style={styles.container}>
          {/* Brand */}
          <View style={styles.brandContainer}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.brandText, { color: isDark ? '#FFFFFF' : colors.navy }]}>
              SAHAYAK
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Dark / Light Mode Toggle */}
            <ThemeToggleBtn />

            {/* Live ML Service Indicator */}
            <MLServiceIndicator />

            {/* Static Role Badge */}
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isDark ? '#1E293B' : colors.backgroundSelected,
                  borderColor: isDark ? '#334155' : colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons name={currentRoleInfo.icon as any} size={14} color={currentRoleInfo.color} />
              <Text style={[styles.roleText, { color: currentRoleInfo.color }]}>
                {currentRoleInfo.title}
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.stateSustained} />
            </TouchableOpacity>
          </View>
        </View>

        {mlStatus === 'disconnected' && !isOffline && (
          <View
            style={[
              styles.offlineBanner,
              {
                backgroundColor: isDark ? '#451A03' : '#FEF2F2',
                borderBottomColor: isDark ? '#78350F' : '#FECACA',
                borderBottomWidth: 1,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={[styles.offlineBannerText, { color: isDark ? '#FECDD3' : '#991B1B' }]}>
                ML Service Disconnected — Fallback local inference active. Zero risk undercounting enabled.
              </Text>
            </View>
          </View>
        )}

        {isOffline && (
          <View style={[styles.offlineBanner, { backgroundColor: colors.warningBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="cloud-offline" size={14} color={colors.warning} />
              <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
                Offline mode active. All observations are encrypted locally in SQLite and will sync when reconnected.
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Web-only Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconRow}>
              <Ionicons name="log-out-outline" size={32} color={Colors.light.stateSustained} />
            </View>
            <Text style={styles.modalTitle}>Log Out</Text>
            {currentUser && (
              <Text style={styles.modalSubtitle}>Logged in as {currentUser.name}</Text>
            )}
            <Text style={styles.modalBody}>
              Are you sure you want to log out? Any unsynced data is saved locally.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnLogout]}
                onPress={() => { setShowLogoutModal(false); handleLogout(); }}
              >
                <Text style={styles.modalBtnLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.backgroundElement,
    ...Shadow.sm,
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    height: 56,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.navy,
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  offlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.background,
  },
  offlineToggleActive: {
    backgroundColor: Colors.light.warningBg,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  /** Static badge — no chevron, not pressable */
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 4,
    flexShrink: 0,
  },
  offlineBanner: {
    backgroundColor: Colors.light.warningBg,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: Colors.light.warning,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  /* Modal (web) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.six,
    width: '100%',
    maxWidth: 320,
    ...Shadow.lg,
    alignItems: 'center',
  },
  modalIconRow: {
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.two,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.two,
  },
  modalBody: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.six,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalBtnCancelText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  modalBtnLogout: {
    backgroundColor: Colors.light.stateSustained,
  },
  modalBtnLogoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});
