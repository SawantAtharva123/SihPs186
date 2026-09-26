import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function UnitPulseScreen() {
  const [feedback, setFeedback] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState('Schedule');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unit Pulse — Unit 402</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Unit Health Aggregate</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Recovery Trend</Text>
          <Text style={[styles.statValue, { color: Colors.light.stateSustained }]}>Declining</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Schedule Volatility</Text>
          <Text style={styles.statValue}>High</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Participation</Text>
          <Text style={styles.statValue}>84%</Text>
        </View>
        <Text style={styles.kAnonNote}>Data suppressed if &lt; 5 responses.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Voice of Personnel (Anonymous)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.four }}>
          {['Schedule', 'Workload', 'Safety', 'Welfare'].map(c => (
            <TouchableOpacity key={c} style={[styles.pill, category === c && styles.pillActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.pillText, category === c && styles.pillTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TextInput
          style={styles.input}
          placeholder="Share your feedback or concerns..."
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
        />
        
        <TouchableOpacity style={styles.submitBtn} onPress={() => { setFeedback(''); alert('Feedback submitted anonymously.'); }}>
          <Text style={styles.submitBtnText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  card: { backgroundColor: Colors.light.backgroundElement, margin: Spacing.four, padding: Spacing.four, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.border },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: Colors.light.borderSubtle },
  statLabel: { fontSize: 15, color: Colors.light.textSecondary },
  statValue: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text },
  kAnonNote: { fontSize: 12, color: Colors.light.textMuted, marginTop: Spacing.three, fontStyle: 'italic' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border, marginRight: Spacing.two },
  pillActive: { backgroundColor: Colors.light.navy, borderColor: Colors.light.navy },
  pillText: { color: Colors.light.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.md, padding: Spacing.three, minHeight: 100, textAlignVertical: 'top', fontSize: 16, marginBottom: Spacing.four },
  submitBtn: { backgroundColor: Colors.light.primary, padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
