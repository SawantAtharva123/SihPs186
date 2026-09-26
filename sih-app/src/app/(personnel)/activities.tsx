import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import QuickTapGame from '@/components/games/QuickTapGame';
import GoNoGoGame from '@/components/games/GoNoGoGame';
import SequenceRecallGame from '@/components/games/SequenceRecallGame';
import OddOneOutGame from '@/components/games/OddOneOutGame';
import DirectionMatchGame from '@/components/games/DirectionMatchGame';
import {
  insertActivitySession,
  getGameScoreHistory,
  getTopScores,
} from '@/repositories/activities';
import { useSahayak } from '@/context/SahayakContext';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'quick_tap',       title: 'Quick Tap',       desc: 'Reaction time & variability · ~20s',  icon: 'flash',      recommended: true },
  { id: 'go_no_go',        title: 'Go / No-Go',       desc: 'Attention & inhibition · ~30s',        icon: 'hand-right', recommended: false },
  { id: 'sequence_recall', title: 'Sequence Recall',  desc: 'Working memory · ~45s',                icon: 'grid',       recommended: false },
  { id: 'odd_one_out',     title: 'Odd One Out',       desc: 'Visual attention · ~40s',              icon: 'eye',        recommended: true },
  { id: 'direction_match', title: 'Direction Match',  desc: 'Response speed · ~30s',                icon: 'compass',    recommended: false },
];

const ACTIVITY_LABEL: Record<string, string> = {
  quick_tap:       'Quick Tap',
  go_no_go:        'Go / No-Go',
  sequence_recall: 'Sequence Recall',
  odd_one_out:     'Odd One Out',
  direction_match: 'Direction Match',
};

const ACTIVITY_ICON: Record<string, string> = {
  quick_tap:       'flash',
  go_no_go:        'hand-right',
  sequence_recall: 'grid',
  odd_one_out:     'eye',
  direction_match: 'compass',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function scoreColor(score: number) {
  if (score >= 80) return Colors.light.success;
  if (score >= 50) return Colors.light.warning;
  return Colors.light.stateSustained;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ActivitiesScreen() {
  const { currentUser } = useSahayak();
  const personId = currentUser?.id ?? 'person-001';

  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'play' | 'scores'>('play');

  // Scores state
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadScores = useCallback(async () => {
    try {
      setLoadingScores(true);
      const [recent, top] = await Promise.all([
        getGameScoreHistory(personId, undefined, 20),
        getTopScores(personId),
      ]);
      setRecentSessions(recent);
      setTopScores(top);
    } catch (e) {
      console.warn('Load scores error:', e);
    } finally {
      setLoadingScores(false);
      setRefreshing(false);
    }
  }, [personId]);

  // Reload scores whenever the Scores tab is shown or screen re-focused
  useFocusEffect(
    useCallback(() => {
      if (tab === 'scores') loadScores();
    }, [tab, loadScores]),
  );

  // ── Game result handler ──────────────────────────────────────────────────
  async function handleResult(activityType: string, result: any) {
    try {
      await insertActivitySession({
        activityType,
        difficulty: 'standard',
        durationMs: result.durationMs ?? 0,
        score: result.score ?? result.accuracy ?? 0,
        accuracy: result.accuracy ?? 0,
        avgReactionTimeMs: result.avgReactionTimeMs ?? 0,
        reactionVariabilityMs: result.reactionVariabilityMs ?? 0,
        correctAnswers: result.correctAnswers ?? 0,
        incorrectAnswers: result.incorrectAnswers ?? 0,
        missedAnswers: result.missedAnswers ?? 0,
      });
      setCompletedToday(prev => new Set([...prev, activityType]));
      // Refresh scores in background so they're ready when user switches tab
      getGameScoreHistory(personId, undefined, 20).then(setRecentSessions);
      getTopScores(personId).then(setTopScores);
    } catch (e) {
      console.warn('Save activity error:', e);
    }
  }

  // ── Sub-screens ──────────────────────────────────────────────────────────
  function renderPlayTab() {
    return (
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>Daily Recommended</Text>
        {ACTIVITIES.map(act => (
          <TouchableOpacity key={act.id} style={styles.card} onPress={() => setActiveGame(act.id)}>
            <View style={styles.iconBox}>
              <Ionicons name={act.icon as any} size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{act.title}</Text>
              <Text style={styles.cardDesc}>{act.desc}</Text>
            </View>
            {completedToday.has(act.id) ? (
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
            ) : act.recommended ? (
              <View style={styles.recBadge}><Text style={styles.recText}>Rec</Text></View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderScoresTab() {
    return (
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadScores(); }}
            tintColor={Colors.light.primary}
          />
        }
      >
        {/* ── Personal Bests ── */}
        <Text style={styles.sectionTitle}>Personal Bests</Text>
        {topScores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={36} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>No scores yet. Play a game to get started!</Text>
          </View>
        ) : (
          topScores.map((row, i) => (
            <View key={row.activity_type} style={styles.topScoreCard}>
              <View style={styles.topScoreRank}>
                <Text style={styles.rankNum}>#{i + 1}</Text>
              </View>
              <View style={styles.iconBox}>
                <Ionicons
                  name={(ACTIVITY_ICON[row.activity_type] ?? 'game-controller') as any}
                  size={22}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{ACTIVITY_LABEL[row.activity_type] ?? row.activity_type}</Text>
                <Text style={styles.cardDesc}>{row.attempts} attempt{row.attempts !== 1 ? 's' : ''}</Text>
              </View>
              <View style={[styles.scorePill, { backgroundColor: scoreColor(row.best_score) + '22' }]}>
                <Text style={[styles.scoreNum, { color: scoreColor(row.best_score) }]}>
                  {Math.round(row.best_score)}
                </Text>
                <Text style={[styles.scoreLabel, { color: scoreColor(row.best_score) }]}>pts</Text>
              </View>
            </View>
          ))
        )}

        {/* ── Recent History ── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.six }]}>Recent Sessions</Text>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={36} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>No sessions recorded yet.</Text>
          </View>
        ) : (
          recentSessions.map(s => (
            <View key={s.id} style={styles.historyCard}>
              <View style={[styles.historyIconBox, { backgroundColor: Colors.light.primaryLight }]}>
                <Ionicons
                  name={(ACTIVITY_ICON[s.activity_type] ?? 'game-controller') as any}
                  size={18}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.historyMeta}>
                <Text style={styles.historyTitle}>{ACTIVITY_LABEL[s.activity_type] ?? s.activity_type}</Text>
                <Text style={styles.historyDate}>{formatDate(s.start_time)}</Text>
                <View style={styles.historyStats}>
                  <Text style={styles.historyStat}>
                    ✓ {s.correct_answers}  ✗ {s.incorrect_answers}
                  </Text>
                  {s.avg_reaction_time_ms > 0 && (
                    <Text style={styles.historyStat}>
                      ⚡ {Math.round(s.avg_reaction_time_ms)} ms
                    </Text>
                  )}
                  {s.accuracy > 0 && (
                    <Text style={styles.historyStat}>
                      {Math.round(s.accuracy)}% acc
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.scorePill, { backgroundColor: scoreColor(s.score) + '22' }]}>
                <Text style={[styles.scoreNum, { color: scoreColor(s.score) }]}>
                  {Math.round(s.score)}
                </Text>
                <Text style={[styles.scoreLabel, { color: scoreColor(s.score) }]}>pts</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cognitive Activities</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'play' && styles.tabItemActive]}
          onPress={() => setTab('play')}
        >
          <Ionicons
            name="game-controller"
            size={18}
            color={tab === 'play' ? Colors.light.primary : Colors.light.textMuted}
          />
          <Text style={[styles.tabLabel, tab === 'play' && styles.tabLabelActive]}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'scores' && styles.tabItemActive]}
          onPress={() => { setTab('scores'); loadScores(); }}
        >
          <Ionicons
            name="trophy"
            size={18}
            color={tab === 'scores' ? Colors.light.primary : Colors.light.textMuted}
          />
          <Text style={[styles.tabLabel, tab === 'scores' && styles.tabLabelActive]}>Scores</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'play' ? renderPlayTab() : renderScoresTab()}

      {/* Game Modals */}
      <QuickTapGame
        visible={activeGame === 'quick_tap'}
        onClose={() => setActiveGame(null)}
        onResult={(r: any) => handleResult('quick_tap', r)}
      />
      {activeGame === 'go_no_go' && (
        <GoNoGoGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('go_no_go', r)}
        />
      )}
      <SequenceRecallGame
        visible={activeGame === 'sequence_recall'}
        onClose={() => setActiveGame(null)}
        onResult={(r: any) => handleResult('sequence_recall', r)}
      />
      <OddOneOutGame
        visible={activeGame === 'odd_one_out'}
        onClose={() => setActiveGame(null)}
        onResult={(r: any) => handleResult('odd_one_out', r)}
      />
      <DirectionMatchGame
        visible={activeGame === 'direction_match'}
        onClose={() => setActiveGame(null)}
        onResult={(r: any) => handleResult('direction_match', r)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.light.background },
  header:         { padding: Spacing.four, backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerTitle:    { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy },

  /* Tab bar */
  tabBar:         { flexDirection: 'row', backgroundColor: Colors.light.backgroundElement, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  tabItem:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  tabItemActive:  { borderBottomWidth: 2, borderBottomColor: Colors.light.primary },
  tabLabel:       { fontSize: 14, fontWeight: '500', color: Colors.light.textMuted },
  tabLabelActive: { color: Colors.light.primary, fontWeight: '700' },

  list:           { padding: Spacing.four },
  sectionTitle:   { fontSize: 14, fontWeight: 'bold', color: Colors.light.textMuted, textTransform: 'uppercase', marginBottom: Spacing.four, letterSpacing: 1 },

  /* Play-tab cards */
  card:           { flexDirection: 'row', backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.three, alignItems: 'center', borderWidth: 1, borderColor: Colors.light.borderSubtle },
  iconBox:        { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.four },
  cardContent:    { flex: 1 },
  cardTitle:      { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  cardDesc:       { fontSize: 13, color: Colors.light.textSecondary, marginTop: Spacing.one },
  recBadge:       { backgroundColor: Colors.light.accentLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  recText:        { color: Colors.light.accent, fontSize: 12, fontWeight: 'bold' },

  /* Scores tab */
  emptyCard:      { alignItems: 'center', paddingVertical: Spacing.ten, gap: Spacing.three },
  emptyText:      { color: Colors.light.textMuted, textAlign: 'center', fontSize: 14 },

  topScoreCard:   { flexDirection: 'row', backgroundColor: Colors.light.backgroundElement, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.three, alignItems: 'center', borderWidth: 1, borderColor: Colors.light.borderSubtle },
  topScoreRank:   { width: 28, alignItems: 'center', marginRight: Spacing.two },
  rankNum:        { fontSize: 12, fontWeight: '700', color: Colors.light.textMuted },

  scorePill:      { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, minWidth: 52 },
  scoreNum:       { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  scoreLabel:     { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  historyCard:    { flexDirection: 'row', backgroundColor: Colors.light.backgroundElement, padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.two, alignItems: 'center', borderWidth: 1, borderColor: Colors.light.borderSubtle },
  historyIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
  historyMeta:    { flex: 1 },
  historyTitle:   { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  historyDate:    { fontSize: 12, color: Colors.light.textMuted, marginTop: 2 },
  historyStats:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 4 },
  historyStat:    { fontSize: 11, color: Colors.light.textSecondary },
});
