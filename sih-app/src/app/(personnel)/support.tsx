import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function SupportScreen() {
  const { colors, isDark } = useTheme();

  const handleRequestCheckIn = () => {
    Alert.alert(
      'Welfare Check-in Requested',
      'Your unit welfare officer (Capt. Meera Nair) has been notified. You will be scheduled for a confidential 1-on-1 discussion within 24 hours.'
    );
  };

  const handleContact = (name: string) => {
    Alert.alert(`Connecting with ${name}`, `Initiating secure unit communication channel...`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Welfare & Crisis Support</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Confidential assistance, peer buddies & emergency helplines
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <BouncyPressable style={[styles.mainAction, { backgroundColor: colors.primary }]} onPress={handleRequestCheckIn}>
          <Ionicons name="chatbubbles" size={32} color="#fff" />
          <View style={styles.mainActionText}>
            <Text style={styles.mainActionTitle}>Request Welfare Check-in</Text>
            <Text style={styles.mainActionSub}>Confidential discussion with your unit officer</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
        </BouncyPressable>
      </FadeInView>

      <FadeInView delay={150}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.2)' : colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Capt. Meera Nair</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.cardSub, { color: colors.success }]}>Welfare Officer • Available</Text>
              </View>
            </View>
          </View>
          <BouncyPressable
            style={[styles.btn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
            onPress={() => handleContact('Capt. Meera Nair')}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Contact Officer</Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : '#EBF9F1' }]}>
              <Ionicons name="people" size={24} color={colors.success} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cpl. Rajan Kumar</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.cardSub, { color: colors.success }]}>Assigned Buddy • On Duty</Text>
              </View>
            </View>
          </View>
          <BouncyPressable
            style={[styles.btn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
            onPress={() => handleContact('Cpl. Rajan Kumar')}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text style={[styles.btnText, { color: colors.text }]}>Message Buddy</Text>
          </BouncyPressable>
        </View>
      </FadeInView>

      <FadeInView delay={250}>
        <View style={[
          styles.emergencyCard,
          {
            backgroundColor: isDark ? 'rgba(231, 76, 60, 0.12)' : colors.stateSustainedBg,
            borderColor: isDark ? 'rgba(231, 76, 60, 0.3)' : colors.stateSustained,
          }
        ]}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={20} color={colors.stateSustained} />
            <Text style={[styles.emergencyTitle, { color: colors.stateSustained }]}>Emergency 24/7 Helplines</Text>
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
        All support inquiries and requests are handled with absolute confidentiality and military medical discretion.
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four },
  header: { marginBottom: Spacing.four },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  mainAction: { flexDirection: 'row', padding: Spacing.five, borderRadius: Radius.xl, alignItems: 'center', marginBottom: Spacing.four },
  mainActionText: { marginLeft: Spacing.four, flex: 1 },
  mainActionTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  mainActionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  card: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { marginLeft: Spacing.three, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardSub: { fontSize: 12, fontWeight: '600' },
  btn: { flexDirection: 'row', padding: Spacing.three, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  btnText: { fontWeight: '700', fontSize: 14 },
  emergencyCard: { padding: Spacing.four, borderRadius: Radius.lg, marginTop: Spacing.two, borderWidth: 1 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.three },
  emergencyTitle: { fontWeight: '800', fontSize: 15 },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two, gap: Spacing.three },
  emergencyText: { fontWeight: '600', fontSize: 13 },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: Spacing.six, paddingHorizontal: Spacing.four, lineHeight: 18 },
});
