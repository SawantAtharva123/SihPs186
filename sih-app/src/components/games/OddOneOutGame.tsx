import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
}

const TOTAL_ROUNDS = 5;
const GRID_SIZE = 16;

export default function OddOneOutGame({ visible, onClose, onResult }: Props) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'playing' | 'feedback' | 'finished'>('idle');
  const [grid, setGrid] = useState<any[]>([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [elapsedTimes, setElapsedTimes] = useState<number[]>([]);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

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
    setTappedIndex(null);

    // 400ms preparatory interval before next grid is presented
    timerRef.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      setOddIndex(idx);
      
      const items = Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        color: i === idx ? Colors.light.accent : Colors.light.primary,
        borderRadius: i === idx ? 25 : 8,
      }));
      
      setGrid(items);
      setGameState('playing');
      // Timer starts EXACTLY when the grid appears
      startTimeRef.current = Date.now();
    }, 400);
  };

  const startNewGame = () => {
    clearTimer();
    setRound(0);
    roundRef.current = 0;
    setHits(0);
    hitsRef.current = 0;
    setElapsedTimes([]);
    rtsRef.current = [];
    setTappedIndex(null);
    scheduleNextTrial();
  };

  useEffect(() => {
    if (!visible) {
      clearTimer();
      setGameState('idle');
    }
    return () => clearTimer();
  }, [visible]);

  const handleTap = (index: number) => {
    if (gameState !== 'playing') return;

    // Capture reaction time at the exact millisecond of tap
    const tapTime = Date.now();
    const rt = Math.max(10, tapTime - startTimeRef.current);
    const isCorrect = (index === oddIndex);

    const nextHits = isCorrect ? hitsRef.current + 1 : hitsRef.current;
    hitsRef.current = nextHits;
    setHits(nextHits);

    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    setRound(nextRound);

    const nextTimes = [...rtsRef.current, rt];
    rtsRef.current = nextTimes;
    setElapsedTimes(nextTimes);

    setTappedIndex(index);
    setGameState('feedback');

    // 200ms brief confirmation before next round
    timerRef.current = setTimeout(() => {
      if (nextRound >= TOTAL_ROUNDS) {
        setGameState('finished');
      } else {
        scheduleNextTrial();
      }
    }, 200);
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
        activityType: 'odd_one_out',
        score,
        accuracy,
        avgReactionTimeMs: avgRT,
        reactionVariabilityMs: 0,
        correctAnswers: finalHits,
        incorrectAnswers: TOTAL_ROUNDS - finalHits,
        missedAnswers: 0,
        durationMs: totalDuration || 20000,
      });
    }
    setGameState('idle');
    onClose();
  };

  const scorePct = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
  const avgRT = elapsedTimes.length > 0
    ? Math.round(elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length)
    : 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Odd One Out</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>

          {gameState === 'idle' ? (
            <View style={styles.introContainer}>
              <Text style={styles.subtitle}>
                Test your visual search speed and target discrimination.
              </Text>
              <View style={styles.explainCard}>
                <View style={styles.sampleRow}>
                  <View style={[styles.sampleBox, { backgroundColor: Colors.light.primary, borderRadius: 8 }]} />
                  <View style={[styles.sampleBox, { backgroundColor: Colors.light.primary, borderRadius: 8 }]} />
                  <View style={[styles.sampleBox, { backgroundColor: Colors.light.accent, borderRadius: 25 }]} />
                  <View style={[styles.sampleBox, { backgroundColor: Colors.light.primary, borderRadius: 8 }]} />
                </View>
                <Text style={styles.explainText}>
                  A 4×4 grid of tiles will appear. Find and tap the single tile that has a different shape or colour as quickly as you can.
                </Text>
              </View>
              <Text style={styles.trialInfo}>5 rounds · timer starts when grid appears</Text>
              <TouchableOpacity style={styles.btnStart} onPress={startNewGame}>
                <Text style={styles.btnStartText}>Begin Assessment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>Find and tap the item that looks different.</Text>

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
                {elapsedTimes.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: Colors.light.backgroundElement }]}>
                    <Text style={[styles.badgeText, { color: Colors.light.warning }]}>
                      ⚡ {elapsedTimes[elapsedTimes.length - 1]} ms
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.gridArea}>
                {gameState === 'waiting' ? (
                  <View style={styles.fixationContainer}>
                    <View style={styles.fixationDot} />
                    <Text style={styles.fixationText}>Ready...</Text>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {grid.map((item, i) => {
                      const isTapped = (tappedIndex === i);
                      return (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.7}
                          style={[
                            styles.item,
                            {
                              backgroundColor: item.color,
                              borderRadius: item.borderRadius,
                              transform: [{ scale: isTapped ? 1.15 : 1 }],
                              borderWidth: isTapped ? 3 : 0,
                              borderColor: i === oddIndex ? Colors.light.success : Colors.light.stateSustained,
                            },
                          ]}
                          onPress={() => handleTap(i)}
                          disabled={gameState !== 'playing'}
                        />
                      );
                    })}
                  </View>
                )}
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
                  <Text style={styles.resRt}>⚡ Avg Spotting Time: {avgRT} ms</Text>
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
  },
  introContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.two,
  },
  explainCard: {
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.four,
    borderRadius: Radius.md,
    width: '100%',
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  sampleRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  sampleBox: {
    width: 32,
    height: 32,
  },
  explainText: {
    fontSize: 13,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 18,
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
  gridArea: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'space-between',
  },
  item: {
    width: 52,
    height: 52,
    marginBottom: Spacing.two,
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
