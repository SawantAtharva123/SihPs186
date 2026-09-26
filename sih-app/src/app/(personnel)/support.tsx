import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function SupportScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.mainAction}>
          <Ionicons name="chatbubbles" size={32} color="#fff" />
          <View style={styles.mainActionText}>
            <Text style={styles.mainActionTitle}>Request Welfare Check-in</Text>
            <Text style={styles.mainActionSub}>Confidential discussion with your unit officer</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={40} color={Colors.light.primary} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Capt. Meera Nair</Text>
              <Text style={styles.cardSub}>Welfare Officer • Available</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Contact Officer</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={40} color={Colors.light.accent} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Cpl. Rajan Kumar</Text>
              <Text style={styles.cardSub}>Assigned Buddy • Available</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Contact Buddy</Text></TouchableOpacity>
        </View>

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Resources</Text>
          <View style={styles.emergencyRow}>
            <Ionicons name="call" size={20} color={Colors.light.stateSustained} />
            <Text style={styles.emergencyText}>Crisis Line: 1-800-273-8255</Text>
          </View>
          <View style={styles.emergencyRow}>
            <Ionicons name="medkit" size={20} color={Colors.light.stateSustained} />
            <Text style={styles.emergencyText}>Medical Emergency: 911</Text>
          </View>
        </View>
        
        <Text style={styles.footerNote}>All support requests are handled with strict discretion and confidentiality.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },
  content: { padding: Spacing.four },
  mainAction: { flexDirection: 'row', backgroundColor: Colors.light.primary, padding: Spacing.six, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.six },
  mainActionText: { marginLeft: Spacing.four, flex: 1 },
  mainActionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mainActionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: Spacing.one },
  card: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four, borderWidth: 1, borderColor: Colors.light.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four },
  cardHeaderText: { marginLeft: Spacing.three },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  cardSub: { fontSize: 14, color: Colors.light.success },
  btn: { backgroundColor: Colors.light.backgroundSelected, padding: Spacing.three, borderRadius: Radius.md, alignItems: 'center' },
  btnText: { color: Colors.light.navy, fontWeight: '600' },
  emergencyCard: { backgroundColor: Colors.light.stateSustainedBg, padding: Spacing.four, borderRadius: Radius.lg, marginTop: Spacing.two, borderWidth: 1, borderColor: Colors.light.stateSustained },
  emergencyTitle: { color: Colors.light.stateSustained, fontWeight: 'bold', fontSize: 16, marginBottom: Spacing.three },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two, gap: Spacing.three },
  emergencyText: { color: Colors.light.stateSustained, fontWeight: '600' },
  footerNote: { textAlign: 'center', color: Colors.light.textMuted, fontSize: 13, marginTop: Spacing.eight, paddingHorizontal: Spacing.six }
});
