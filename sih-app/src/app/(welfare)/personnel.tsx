import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { explainPerson } from '@/services/analyticsClient';

export default function WelfarePersonnelScreen() {
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainData, setExplainData] = useState<any>(null);

  const mockPersonnel = [
    { id: '104', name: 'Rohan Verma', state: 'Sustained Concern', badgeBg: Colors.light.stateSustainedBg, badgeText: Colors.light.stateSustained },
    { id: '087', name: 'Amit Singh', state: 'Persistent Deviation', badgeBg: Colors.light.statePersistentBg, badgeText: Colors.light.statePersistent },
    { id: '231', name: 'Priya Sharma', state: 'Conflicting Signals', badgeBg: Colors.light.stateConflictingBg, badgeText: Colors.light.stateConflicting },
  ];

  const handleSelectPerson = async (person: any) => {
    setSelectedPerson(person);
    setExplainLoading(true);
    try {
      const res = await explainPerson('person_' + person.id, { timeframe: '14d' });
      setExplainData(res.data);
    } catch (err) {
      console.error('Explain Person Error:', err);
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personnel Directory</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.light.textMuted} />
          <TextInput placeholder="Search by name or ID..." style={styles.searchInput} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {['All', 'Emerging Change', 'Persistent Deviation', 'Conflicting Signals'].map((f, i) => (
            <TouchableOpacity key={f} style={[styles.filterPill, i === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list}>
        {mockPersonnel.map(p => (
          <TouchableOpacity key={p.id} style={styles.personCard} onPress={() => handleSelectPerson(p)}>
            <View style={styles.personHeader}>
              <View>
                <Text style={styles.personName}>{p.name}</Text>
                <Text style={styles.personId}>ID: {p.id}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: p.badgeBg }]}>
                <Text style={[styles.badgeText, { color: p.badgeText }]}>{p.state}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Person Detail / Root Cause Explorer Modal */}
      <Modal visible={!!selectedPerson} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedPerson?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedPerson(null)}><Ionicons name="close" size={24} color={Colors.light.text} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Root Cause Explorer (ML) */}
            <View style={styles.explorerCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="git-network-outline" size={20} color={Colors.light.navy} />
                <Text style={styles.cardTitle}>ML ROOT CAUSE EXPLORER</Text>
              </View>

              {explainLoading ? (
                <ActivityIndicator size="small" color={Colors.light.navy} />
              ) : (
                <View style={styles.mlBox}>
                  {explainData?.formatted?.length > 0 ? (
                    explainData.formatted.map((f: string, idx: number) => (
                      <Text key={idx} style={styles.mlResultText}>? {f}</Text>
                    ))
                  ) : (
                    <Text style={styles.mlResultText}>Model explanation: {explainData?.explanation || 'No dominant factors isolated.'}</Text>
                  )}
                  {explainData?.timeline?.length > 0 && (
                    <View style={{marginTop: 10}}>
                      <Text style={{fontWeight: 'bold', color: Colors.light.navy}}>Timeline:</Text>
                      {explainData.timeline.map((t: any, idx: number) => (
                        <Text key={idx} style={styles.mlResultText}>- {t.date}: {t.event}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.explorerDesc}>
                This section dynamically isolates the highest-contributing factors to the current deviation using SHAP explainability models from the ML backend.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.four, paddingTop: Spacing.six, borderBottomWidth: 1, borderColor: Colors.light.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy, marginBottom: Spacing.three },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.backgroundElement, borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginBottom: Spacing.three },
  searchInput: { marginLeft: Spacing.two, flex: 1, fontSize: 16 },
  filtersRow: { flexDirection: 'row', gap: Spacing.two },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, marginRight: 8 },
  filterPillActive: { backgroundColor: Colors.light.navy, borderColor: Colors.light.navy },
  filterText: { color: Colors.light.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  
  list: { padding: Spacing.four },
  personCard: { backgroundColor: '#fff', padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.borderSubtle, marginBottom: Spacing.three },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personName: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  personId: { color: Colors.light.textSecondary, fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: Colors.light.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.four, borderBottomWidth: 1, borderColor: Colors.light.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.navy },
  modalBody: { padding: Spacing.four },

  explorerCard: { backgroundColor: Colors.light.stateSustainedBg, padding: Spacing.four, borderRadius: Radius.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.navy },
  explorerDesc: { fontSize: 13, color: Colors.light.textSecondary, marginTop: Spacing.three, lineHeight: 18 },

  mlBox: { backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: Colors.light.borderSubtle },
  mlResultText: { color: Colors.light.textSecondary, marginBottom: 6, fontSize: 14 },
});
