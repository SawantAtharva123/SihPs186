import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function PrivacyScreen() {
  const [wearableSync, setWearableSync] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy & Data</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collected</Text>
          <View style={styles.listItem}><Ionicons name="calendar" size={20} color={Colors.light.primary} /><Text style={styles.listText}>Daily check-ins (sleep, energy, workload)</Text></View>
          <View style={styles.listItem}><Ionicons name="game-controller" size={20} color={Colors.light.primary} /><Text style={styles.listText}>Cognitive activity results</Text></View>
          <View style={styles.listItem}><Ionicons name="time" size={20} color={Colors.light.primary} /><Text style={styles.listText}>Duty and shift schedules</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who Can Access This</Text>
          <View style={styles.listItem}><Ionicons name="person" size={20} color={Colors.light.textSecondary} /><Text style={styles.listText}>You (Full access to own data)</Text></View>
          <View style={styles.listItem}><Ionicons name="shield" size={20} color={Colors.light.textSecondary} /><Text style={styles.listText}>Welfare Officer (Identified patterns & cases)</Text></View>
          <View style={styles.listItem}><Ionicons name="stats-chart" size={20} color={Colors.light.textSecondary} /><Text style={styles.listText}>Command (Anonymous aggregates only)</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Integrations</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Wearable Biometric Sync</Text>
              <Text style={styles.toggleSub}>{wearableSync ? 'Connected' : 'Not connected'}</Text>
            </View>
            <Switch value={wearableSync} onValueChange={setWearableSync} trackColor={{ true: Colors.light.primary }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.btn} onPress={() => alert('Data exported to your device.')}>
            <Ionicons name="download" size={20} color={Colors.light.navy} />
            <Text style={styles.btnText}>Export My Data</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerNote}>Your data is retained only as long as you are active in the unit, in accordance with the Data Privacy Policy.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  content: { padding: Spacing.four },
  section: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1, borderColor: Colors.light.border },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three, gap: Spacing.three },
  listText: { fontSize: 15, color: Colors.light.text },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  toggleSub: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  btn: { flexDirection: 'row', backgroundColor: Colors.light.backgroundSelected, padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  btnText: { color: Colors.light.navy, fontWeight: '600', fontSize: 15 },
  footerNote: { textAlign: 'center', color: Colors.light.textMuted, fontSize: 12, marginTop: Spacing.four }
});
