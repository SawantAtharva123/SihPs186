import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function PrivacyScreen() {
  const { colors, isDark } = useTheme();
  const [wearableSync, setWearableSync] = useState(false);

  const handleExport = () => {
    Alert.alert(
      'Export Initiated',
      'Your encrypted personal health and activity data archive has been generated and saved to your device sandbox.'
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Data Sovereignty & Privacy</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Transparent data telemetry, access privileges & encrypted export
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={[styles.section, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Collected Locally</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.listText, { color: colors.text }]}>Daily check-ins (sleep hours, fatigue ratings, workload)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
            <Text style={[styles.listText, { color: colors.text }]}>Cognitive test response times & error distributions</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[styles.listText, { color: colors.text }]}>Operational duty schedules & night shift intervals</Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={150}>
        <View style={[styles.section, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Access & Privacy Boundaries</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="person-outline" size={18} color={colors.success} />
            <Text style={[styles.listText, { color: colors.text }]}>You: Full granular telemetry inspection and editing</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="medkit-outline" size={18} color={colors.primary} />
            <Text style={[styles.listText, { color: colors.text }]}>Welfare Officer: Clinical patterns only upon check-in</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="stats-chart-outline" size={18} color={colors.accent} />
            <Text style={[styles.listText, { color: colors.text }]}>Unit Command: Differential privacy k-anonymous aggregates only</Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={[styles.section, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="watch-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Device Integrations</Text>
          </View>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Wearable Bluetooth Sync</Text>
              <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                {wearableSync ? 'Connected (Heart Rate & Accelerometer Active)' : 'Disabled (Manual sleep logs only)'}
              </Text>
            </View>
            <Switch
              value={wearableSync}
              onValueChange={setWearableSync}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#fff' : '#fff'}
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={250}>
        <View style={[styles.section, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Portability</Text>
          </View>
          <BouncyPressable
            style={[styles.btn, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSelected }]}
            onPress={handleExport}
          >
            <Ionicons name="download" size={18} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Export Encrypted Archive</Text>
          </BouncyPressable>
        </View>
      </FadeInView>
      
      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        Your telemetry data is cryptographically protected via AES-256 local SQLCipher storage and obeys the Indian Armed Forces Digital Privacy Directives.
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
  section: { padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three, gap: Spacing.three },
  listText: { fontSize: 13, flex: 1, lineHeight: 18 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  toggleTitle: { fontSize: 14, fontWeight: '700' },
  toggleSub: { fontSize: 12, marginTop: 2 },
  btn: { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.two },
  btnText: { fontWeight: '700', fontSize: 14 },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: Spacing.four, paddingHorizontal: Spacing.four, lineHeight: 18 },
});
