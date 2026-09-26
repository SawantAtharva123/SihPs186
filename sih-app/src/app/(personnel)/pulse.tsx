import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

export default function UnitPulseScreen() {
  const { colors, isDark } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('Schedule');

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    setFeedback('');
    Alert.alert('Feedback Submitted', 'Your anonymous feedback has been safely submitted to the unit aggregate.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <FadeInView delay={50}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Unit Pulse — Unit 402</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Anonymous sentiment & operational morale monitoring
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Unit Health Aggregate</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recovery Trend</Text>
            <Text style={[styles.statValue, { color: colors.stateSustained }]}>Declining</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Schedule Volatility</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>High</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Participation</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>84%</Text>
          </View>
          <Text style={[styles.kAnonNote, { color: colors.textMuted }]}>
            Privacy notice: Unit signals suppressed if active sample size &lt; 5 responses (k-anonymity protocol).
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={150}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Voice of Personnel (Anonymous)</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.four }}>
            {['Schedule', 'Workload', 'Safety', 'Welfare'].map(c => {
              const active = category === c;
              return (
                <BouncyPressable
                  key={c}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }, active && { color: '#ffffff', fontWeight: '700' }]}>
                    {c}
                  </Text>
                </BouncyPressable>
              );
            })}
          </ScrollView>
          
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.backgroundTertiary : '#F8FAFC',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Share your feedback or concerns anonymously..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
          />
          
          <BouncyPressable
            style={[styles.submitBtn, { backgroundColor: colors.primary }, !feedback.trim() && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={!feedback.trim()}
          >
            <Text style={styles.submitBtnText}>Submit Anonymous Feedback</Text>
          </BouncyPressable>
        </View>
      </FadeInView>
      
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
  card: { padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.four },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.three, borderBottomWidth: 1 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700' },
  kAnonNote: { fontSize: 11, marginTop: Spacing.three, fontStyle: 'italic' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: Spacing.two },
  pillText: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, minHeight: 110, textAlignVertical: 'top', fontSize: 14, marginBottom: Spacing.four },
  submitBtn: { padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
