import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
}

const TOTAL_ROUNDS = 10;
const ARROWS = ['arrow-up', 'arrow-down', 'arrow-back', 'arrow-forward'] as const;
type ArrowType = typeof ARROWS[number];

function getOpposite(arrow: ArrowType): ArrowType {
  switch (arrow) {
    case 'arrow-up': return 'arrow-down';
    case 'arrow-down': return 'arrow-up';
    case 'arrow-back': return 'arrow-forward';
    case 'arrow-forward': return 'arrow-back';
  }
}

export default function DirectionMatchGame({ visible, onClose, onResult }: Props) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'playing' | 'feedback' | 'finished'>('idle');
  const [arrow, setArrow] = useState<ArrowType>('arrow-up');
  const [isIncongruent, setIsIncongruent] = useState(false);
  const [round, setRound] = useState(0); // 0 to TOTAL_ROUNDS
  const [hits, setHits] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitsRef = useRef<number>(0);
  const roundRef = useRef<number>(0);
  const rtsRef = useRef<number[]>([]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNextTrial = () => {
    clearTimer();
    setGameState('waiting');
    setLastFeedback(null);

    // 450ms preparatory / fixation interval before stimulus appears
    timerRef.current = setTimeout(() => {
      const nextArrow = ARROWS[Math.floor(Math.random() * ARROWS.length)];
      const nextIncongruent = Math.random() > 0.5;
      setArrow(nextArrow);
      setIsIncongruent(nextIncongruent);
      setGameState('playing');
      // Timer starts EXACTLY when the arrow appears
      startTimeRef.current = Date.now();
    }, 450);
  };

  const startNewGame = () => {
    clearTimer();
    setRound(0);
    roundRef.current = 0;
    setHits(0);
    hitsRef.current = 0;
    setReactionTimes([]);
    rtsRef.current = [];
    setLastFeedback(null);
    scheduleNextTrial();
  };

  useEffect(() => {
    if (!visible) {
      clearTimer();
      setGameState('idle');
    }
    return () => clearTimer();
  }, [visible]);

  const handleTap = (dir: ArrowType) => {
    if (gameState !== 'playing') return;

    // Capture reaction time at the exact moment of the tap
    const tapTime = Date.now();
    const rt = Math.max(10, tapTime - startTimeRef.current);

    const target = isIncongruent ? getOpposite(arrow) : arrow;
    const isCorrect = (dir === target);

    const nextHits = isCorrect ? hitsRef.current + 1 : hitsRef.current;
    hitsRef.current = nextHits;
    setHits(nextHits);

    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    setRound(nextRound);

    const updatedRTs = [...rtsRef.current, rt];
    rtsRef.current = updatedRTs;
    setReactionTimes(updatedRTs);

    setLastFeedback(isCorrect ? 'correct' : 'incorrect');
    setGameState('feedback');

    // 220ms brief feedback display before advancing
    timerRef.current = setTimeout(() => {
      if (nextRound >= TOTAL_ROUNDS) {
        setGameState('finished');
      } else {
        scheduleNextTrial();
      }
    }, 220);
  };

  const finish = () => {
    clearTimer();
    if (onResult) {
      const finalHits = hitsRef.current;
      const finalRTs = rtsRef.current;
      const score = Math.min(100, Math.max(0, Math.round((finalHits / TOTAL_ROUNDS) * 100)));
      const accuracy = Math.min(100, Math.max(0, Math.round((finalHits / TOTAL_ROUNDS) * 100)));
      const avgRT = finalRTs.length > 0
        ? Math.round(finalRTs.reduce((a, b) => a + b, 0) / finalRTs.length)
        : 0;
      const totalDuration = finalRTs.reduce((a, b) => a + b, 0);

      onResult({
        activityType: 'direction_match',
        score,
        accuracy,
        avgReactionTimeMs: avgRT,
        reactionVariabilityMs: 0,
        correctAnswers: finalHits,
        incorrectAnswers: TOTAL_ROUNDS - finalHits,
        missedAnswers: 0,
        durationMs: totalDuration || 15000,
      });
    }
    setGameState('idle');
    onClose();
  };

  const scorePct = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
  const avgRT = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Direction Match</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>

          {gameState === 'idle' ? (
            <View style={styles.introContainer}>
              <Text style={styles.subtitle}>
                Test your response speed and cognitive control.
              </Text>
              <View style={styles.ruleExplainCard}>
                <View style={styles.explainRow}>
                  <View style={[styles.miniRuleBox, { backgroundColor: Colors.light.accent }]}>
                    <Text style={styles.miniRuleText}>MATCH</Text>
                  </View>
                  <Text style={styles.explainText}>Tap the arrow pointing the <Text style={styles.bold}>SAME</Text> direction.</Text>
                </View>
                <View style={styles.explainRow}>
                  <View style={[styles.miniRuleBox, { backgroundColor: Colors.light.stateSustained }]}>
                    <Text style={styles.miniRuleText}>OPPOSITE</Text>
                  </View>
                  <Text style={styles.explainText}>Tap the arrow pointing the <Text style={styles.bold}>OPPOSITE</Text> direction.</Text>
                </View>
              </View>
              <Text style={styles.trialInfo}>10 rounds · timer starts on stimulus appearance</Text>
              <TouchableOpacity style={styles.btnStart} onPress={startNewGame}>
                <Text style={styles.btnStartText}>Begin Assessment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                If <Text style={styles.bold}>MATCH</Text>: same arrow. If <Text style={styles.bold}>OPPOSITE</Text>: opposite arrow.
              </Text>

              {/* Progress & Live Score */}
              <View style={styles.statusRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Round {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: Colors.light.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.light.primary }]}>
                    Score: {hits} / {TOTAL_ROUNDS}
                  </Text>
                </View>
                {reactionTimes.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: Colors.light.backgroundElement }]}>
                    <Text style={[styles.badgeText, { color: Colors.light.warning }]}>
                      ⚡ {reactionTimes[reactionTimes.length - 1]} ms
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.gameArea}>
                {gameState === 'waiting' ? (
                  <View style={styles.fixationContainer}>
                    <View style={styles.fixationDot} />
                    <Text style={styles.fixationText}>Ready...</Text>
                  </View>
                ) : (
                  <>
                    <View style={[
                      styles.ruleBox,
                      { backgroundColor: isIncongruent ? Colors.light.stateSustained : Colors.light.accent }
                    ]}>
                      <Text style={styles.ruleText}>{isIncongruent ? 'OPPOSITE' : 'MATCH'}</Text>
                    </View>
                    <Ionicons
                      name={arrow as any}
                      size={84}
                      color={
                        lastFeedback === 'correct'
                          ? Colors.light.success
                          : lastFeedback === 'incorrect'
                          ? Colors.light.stateSustained
                          : Colors.light.navy
                      }
                    />
                  </>
                )}
              </View>
              
              <View style={styles.controls}>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.btnDir, gameState !== 'playing' && styles.btnDirDisabled]}
                    onPress={() => handleTap('arrow-up')}
                    disabled={gameState !== 'playing'}
                  >
                    <Ionicons name="arrow-up" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.btnDir, gameState !== 'playing' && styles.btnDirDisabled]}
                    onPress={() => handleTap('arrow-back')}
                    disabled={gameState !== 'playing'}
                  >
                    <Ionicons name="arrow-back" size={32} color="#fff" />
                  </TouchableOpacity>
                  <View style={{ width: 64 }} />
                  <TouchableOpacity
                    style={[styles.btnDir, gameState !== 'playing' && styles.btnDirDisabled]}
                    onPress={() => handleTap('arrow-forward')}
                    disabled={gameState !== 'playing'}
                  >
                    <Ionicons name="arrow-forward" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.btnDir, gameState !== 'playing' && styles.btnDirDisabled]}
                    onPress={() => handleTap('arrow-down')}
                    disabled={gameState !== 'playing'}
                  >
                    <Ionicons name="arrow-down" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          
          {gameState === 'finished' && (
            <View style={styles.resultsOverlay}>
              <View style={styles.resultsCard}>
                <Ionicons name="trophy" size={48} color={Colors.light.primary} style={{ marginBottom: Spacing.two }} />
                <Text style={styles.resTitle}>Activity Complete</Text>
                <Text style={styles.resScore}>
                  {hits} / {TOTAL_ROUNDS} Correct
                </Text>
                <Text style={styles.resPts}>{scorePct} pts ({scorePct}% Accuracy)</Text>
                {avgRT > 0 && (
                  <Text style={styles.resRt}>⚡ Avg Response Time: {avgRT} ms</Text>
                )}
                <TouchableOpacity style={styles.btnDone} onPress={finish}>
                  <Text style={styles.btnDoneText}>Save & Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: Colors.light.background,
    padding: Spacing.six,
    borderRadius: Radius.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.navy,
  },
  closeBtn: {
    padding: Spacing.one,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  introContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.two,
  },
  ruleExplainCard: {
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.four,
    borderRadius: Radius.md,
    width: '100%',
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  miniRuleBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    minWidth: 84,
    alignItems: 'center',
  },
  miniRuleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  explainText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
  },
  trialInfo: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: Spacing.six,
  },
  btnStart: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: Radius.full,
    width: '100%',
    alignItems: 'center',
  },
  btnStartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  badge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  gameArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: Spacing.four,
  },
  fixationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    opacity: 0.6,
    marginBottom: Spacing.two,
  },
  fixationText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    fontWeight: '600',
  },
  ruleBox: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.two,
  },
  ruleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1.2,
  },
  controls: {
    width: 240,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  btnDir: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDirDisabled: {
    opacity: 0.45,
  },
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.six,
  },
  resultsCard: {
    alignItems: 'center',
    width: '100%',
  },
  resTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.navy,
    marginBottom: Spacing.two,
  },
  resScore: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  resPts: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.success,
    marginBottom: Spacing.two,
  },
  resRt: {
    fontSize: 14,
    color: Colors.light.warning,
    fontWeight: '600',
    marginBottom: Spacing.six,
  },
  btnDone: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  btnDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
