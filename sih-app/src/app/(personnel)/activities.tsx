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
import { Spacing, Radius } from '@/constants/theme';
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
import { useTheme } from '@/context/ThemeContext';
import { FadeInView } from '@/components/animations/FadeInView';
import { BouncyPressable } from '@/components/animations/BouncyPressable';

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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ActivitiesScreen() {
  const { currentUser } = useSahayak();
  const { colors, isDark } = useTheme();
  const personId = currentUser?.id ?? 'person-001';

  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'play' | 'scores'>('play');

  // Scores state
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function getScoreColor(score: number) {
    if (score >= 80) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.stateSustained;
  }

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
      const rawScore = result.score ?? result.accuracy ?? 0;
      const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore)));
      const rawAccuracy = result.accuracy ?? 0;
      const normalizedAccuracy = Math.min(
        100,
        Math.max(0, Math.round(rawAccuracy > 1 ? rawAccuracy : rawAccuracy * 100))
      );

      await insertActivitySession({
        activityType,
        difficulty: 'standard',
        durationMs: result.durationMs ?? 0,
        score: normalizedScore,
        accuracy: normalizedAccuracy,
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
        <FadeInView delay={50}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Daily Recommended Tasks</Text>
        </FadeInView>
        {ACTIVITIES.map((act, idx) => (
          <FadeInView key={act.id} delay={80 + idx * 40}>
            <BouncyPressable
              style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              onPress={() => setActiveGame(act.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
                <Ionicons name={act.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{act.title}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{act.desc}</Text>
              </View>
              {completedToday.has(act.id) ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : act.recommended ? (
                <View style={[styles.recBadge, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : colors.accentLight }]}>
                  <Text style={[styles.recText, { color: isDark ? colors.success : colors.accent }]}>Rec</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </BouncyPressable>
          </FadeInView>
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
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Personal Bests ── */}
        <FadeInView delay={50}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Personal Bests</Text>
        </FadeInView>
        {topScores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No scores yet. Play a game to get started!</Text>
          </View>
        ) : (
          topScores.map((row, i) => {
            const scColor = getScoreColor(row.best_score);
            return (
              <FadeInView key={row.activity_type} delay={80 + i * 40}>
                <View style={[styles.topScoreCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={styles.topScoreRank}>
                    <Text style={[styles.rankNum, { color: colors.textMuted }]}>#{i + 1}</Text>
                  </View>
                  <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
                    <Ionicons
                      name={(ACTIVITY_ICON[row.activity_type] ?? 'game-controller') as any}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{ACTIVITY_LABEL[row.activity_type] ?? row.activity_type}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{row.attempts} attempt{row.attempts !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: scColor + '22' }]}>
                    <Text style={[styles.scoreNum, { color: scColor }]}>
                      {Math.round(row.best_score)}
                    </Text>
                    <Text style={[styles.scoreLabel, { color: scColor }]}>pts</Text>
                  </View>
                </View>
              </FadeInView>
            );
          })
        )}

        {/* ── Recent History ── */}
        <FadeInView delay={120}>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.six, color: colors.textSecondary }]}>Recent Sessions</Text>
        </FadeInView>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sessions recorded yet.</Text>
          </View>
        ) : (
          recentSessions.map((s, i) => {
            const scColor = getScoreColor(s.score);
            return (
              <FadeInView key={s.id} delay={140 + i * 30}>
                <View style={[styles.historyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={[styles.historyIconBox, { backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : colors.primaryLight }]}>
                    <Ionicons
                      name={(ACTIVITY_ICON[s.activity_type] ?? 'game-controller') as any}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>{ACTIVITY_LABEL[s.activity_type] ?? s.activity_type}</Text>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>{formatDate(s.start_time)}</Text>
                    <View style={styles.historyStats}>
                      <Text style={[styles.historyStat, { color: colors.textSecondary }]}>
                        ✓ {s.correct_answers}  ✗ {s.incorrect_answers}
                      </Text>
                      {s.avg_reaction_time_ms > 0 && (
                        <Text style={[styles.historyStat, { color: colors.warning }]}>
                          ⚡ {Math.round(s.avg_reaction_time_ms)} ms
                        </Text>
                      )}
                      {s.accuracy > 0 && (
                        <Text style={[styles.historyStat, { color: colors.success }]}>
                          {Math.round(s.accuracy)}% acc
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: scColor + '22' }]}>
                    <Text style={[styles.scoreNum, { color: scColor }]}>
                      {Math.round(s.score)}
                    </Text>
                    <Text style={[styles.scoreLabel, { color: scColor }]}>pts</Text>
                  </View>
                </View>
              </FadeInView>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cognitive Activities</Text>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'play' && [styles.tabItemActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setTab('play')}
        >
          <Ionicons
            name="game-controller"
            size={18}
            color={tab === 'play' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabLabel, { color: colors.textMuted }, tab === 'play' && { color: colors.primary, fontWeight: '700' }]}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'scores' && [styles.tabItemActive, { borderBottomColor: colors.primary }]]}
          onPress={() => { setTab('scores'); loadScores(); }}
        >
          <Ionicons
            name="trophy"
            size={18}
            color={tab === 'scores' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabLabel, { color: colors.textMuted }, tab === 'scores' && { color: colors.primary, fontWeight: '700' }]}>Scores</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'play' ? renderPlayTab() : renderScoresTab()}

      {/* Game Modals */}
      {activeGame === 'quick_tap' && (
        <QuickTapGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('quick_tap', r)}
        />
      )}
      {activeGame === 'go_no_go' && (
        <GoNoGoGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('go_no_go', r)}
        />
      )}
      {activeGame === 'sequence_recall' && (
        <SequenceRecallGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('sequence_recall', r)}
        />
      )}
      {activeGame === 'odd_one_out' && (
        <OddOneOutGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('odd_one_out', r)}
        />
      )}
      {activeGame === 'direction_match' && (
        <DirectionMatchGame
          visible
          onClose={() => setActiveGame(null)}
          onResult={(r: any) => handleResult('direction_match', r)}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { padding: Spacing.four, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 24, fontWeight: 'bold' },

  /* Tab bar */
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  tabItemActive:  { borderBottomWidth: 2 },
  tabLabel:       { fontSize: 14, fontWeight: '500' },

  list:           { padding: Spacing.four },
  sectionTitle:   { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: Spacing.three, letterSpacing: 0.8 },

  /* Play-tab cards */
  card:           { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.three, alignItems: 'center', borderWidth: 1 },
  iconBox:        { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.four },
  cardContent:    { flex: 1 },
  cardTitle:      { fontSize: 16, fontWeight: 'bold' },
  cardDesc:       { fontSize: 13, marginTop: Spacing.one },
  recBadge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  recText:        { fontSize: 12, fontWeight: 'bold' },

  /* Scores tab */
  emptyCard:      { alignItems: 'center', paddingVertical: Spacing.ten, gap: Spacing.three },
  emptyText:      { textAlign: 'center', fontSize: 14 },

  topScoreCard:   { flexDirection: 'row', padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.three, alignItems: 'center', borderWidth: 1 },
  topScoreRank:   { width: 28, alignItems: 'center', marginRight: Spacing.two },
  rankNum:        { fontSize: 12, fontWeight: '700' },

  scorePill:      { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, minWidth: 52 },
  scoreNum:       { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  scoreLabel:     { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  historyCard:    { flexDirection: 'row', padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.two, alignItems: 'center', borderWidth: 1 },
  historyIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
  historyMeta:    { flex: 1 },
  historyTitle:   { fontSize: 14, fontWeight: '600' },
  historyDate:    { fontSize: 12, marginTop: 2 },
  historyStats:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 4 },
  historyStat:    { fontSize: 11 },
});
