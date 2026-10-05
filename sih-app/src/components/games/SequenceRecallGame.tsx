import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
}

const TOTAL_ROUNDS = 5;
const BLOCK_COLORS = [
  Colors.light.stateSustained, // Red
  Colors.light.primary,        // Blue
  Colors.light.success,        // Green
  Colors.light.warning,        // Yellow/Amber
];

const BLOCK_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];

export default function SequenceRecallGame({ visible, onClose, onResult }: Props) {
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'playing' | 'feedback' | 'finished'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [round, setRound] = useState(0); // 0 to TOTAL_ROUNDS
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(3);
  const [maxLevel, setMaxLevel] = useState(0);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const [totalTaps, setTotalTaps] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userSequenceRef = useRef<number[]>([]);
  const sequenceRef = useRef<number[]>([]);
  const roundRef = useRef<number>(0);
  const successfulRef = useRef<number>(0);
  const levelRef = useRef<number>(3);
  const maxLevelRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playSequenceAnimation = (seq: number[]) => {
    setGameState('showing');
    setActiveBlock(null);
    setFeedback(null);

    let step = 0;
    const playNext = () => {
      if (step >= seq.length) {
        setActiveBlock(null);
        timerRef.current = setTimeout(() => {
          userSequenceRef.current = [];
          setUserSequence([]);
          setGameState('playing');
        }, 300);
        return;
      }

      const blockIdx = seq[step];
      setActiveBlock(blockIdx);

      // Light up for 500ms
      timerRef.current = setTimeout(() => {
        setActiveBlock(null);
        step++;
        // 180ms pause between blocks
        timerRef.current = setTimeout(playNext, 180);
      }, 500);
    };

    // Small delay before sequence starts
    timerRef.current = setTimeout(playNext, 500);
  };

  const startRound = (len: number) => {
    clearTimer();
    const newSeq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    sequenceRef.current = newSeq;
    setSequence(newSeq);
    userSequenceRef.current = [];
    setUserSequence([]);
    playSequenceAnimation(newSeq);
  };

  const startNewGame = () => {
    clearTimer();
    setRound(0);
    roundRef.current = 0;
    setSuccessfulRounds(0);
    successfulRef.current = 0;
    setCurrentLevel(3);
    levelRef.current = 3;
    setMaxLevel(0);
    maxLevelRef.current = 0;
    setTotalTaps(0);
    setCorrectTaps(0);
    setFeedback(null);
    startRound(3);
  };

  useEffect(() => {
    if (visible) {
      startNewGame();
    } else {
      clearTimer();
      setGameState('idle');
    }
    return () => clearTimer();
  }, [visible]);

  const handleTap = (index: number) => {
    if (gameState !== 'playing') return;

    // Flash tapped block briefly
    setActiveBlock(index);
    setTimeout(() => setActiveBlock(null), 150);

    const seq = sequenceRef.current;
    const currentStep = userSequenceRef.current.length;
    const isCorrect = (seq[currentStep] === index);

    setTotalTaps(t => t + 1);
    if (isCorrect) {
      setCorrectTaps(c => c + 1);
    }

    if (!isCorrect) {
      // Mistake made
      setGameState('feedback');
      setFeedback({ text: 'Incorrect sequence', color: Colors.light.stateSustained });
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);

      timerRef.current = setTimeout(() => {
        if (nextRound >= TOTAL_ROUNDS) {
          setGameState('finished');
        } else {
          // Retry at current or min 3
          startRound(levelRef.current);
        }
      }, 1000);
      return;
    }

    // Correct tap
    const nextUserSeq = [...userSequenceRef.current, index];
    userSequenceRef.current = nextUserSeq;
    setUserSequence(nextUserSeq);

    // Checked if entire sequence was completed
    if (nextUserSeq.length === seq.length) {
      const nextSuccessful = successfulRef.current + 1;
      successfulRef.current = nextSuccessful;
      setSuccessfulRounds(nextSuccessful);

      const achievedLevel = levelRef.current;
      if (achievedLevel > maxLevelRef.current) {
        maxLevelRef.current = achievedLevel;
        setMaxLevel(achievedLevel);
      }

      setGameState('feedback');
      setFeedback({ text: '✓ Sequence completed!', color: Colors.light.success });

      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);

      const nextLevel = levelRef.current + 1;
      levelRef.current = nextLevel;
      setCurrentLevel(nextLevel);

      timerRef.current = setTimeout(() => {
        if (nextRound >= TOTAL_ROUNDS) {
          setGameState('finished');
        } else {
          startRound(nextLevel);
        }
      }, 1000);
    }
  };

  const finish = () => {
    clearTimer();
    if (onResult) {
      const score = Math.min(100, Math.max(0, Math.round((successfulRef.current / TOTAL_ROUNDS) * 100)));
      const accuracy = totalTaps > 0
        ? Math.min(100, Math.max(0, Math.round((correctTaps / totalTaps) * 100)))
        : 0;

      onResult({
        activityType: 'sequence_recall',
        score,
        accuracy,
        avgReactionTimeMs: 0,
        reactionVariabilityMs: 0,
        correctAnswers: successfulRef.current,
        incorrectAnswers: TOTAL_ROUNDS - successfulRef.current,
        missedAnswers: 0,
        durationMs: 30000,
      });
    }
    setGameState('idle');
    onClose();
  };

  const scorePct = Math.min(100, Math.max(0, Math.round((successfulRounds / TOTAL_ROUNDS) * 100)));
  const tapAccuracy = totalTaps > 0
    ? Math.min(100, Math.max(0, Math.round((correctTaps / totalTaps) * 100)))
    : 100;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Sequence Recall</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Watch the sequence light up, then tap the blocks in order.</Text>

          {/* Progress & Live Score */}
          <View style={styles.statusRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Round {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.light.primaryLight }]}>
              <Text style={[styles.badgeText, { color: Colors.light.primary }]}>
                Score: {successfulRounds} / {TOTAL_ROUNDS}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.light.backgroundElement }]}>
              <Text style={styles.badgeText}>
                Length: {sequence.length}
              </Text>
            </View>
          </View>

          {/* Instruction / State Indicator */}
          <View style={styles.hintContainer}>
            {feedback ? (
              <Text style={[styles.hintText, { color: feedback.color, fontWeight: '700' }]}>
                {feedback.text}
              </Text>
            ) : gameState === 'showing' ? (
              <Text style={[styles.hintText, { color: Colors.light.primary }]}>
                👀 Watch sequence...
              </Text>
            ) : gameState === 'playing' ? (
              <Text style={[styles.hintText, { color: Colors.light.success }]}>
                👉 Your turn! ({userSequence.length} / {sequence.length})
              </Text>
            ) : null}
          </View>
          
          <View style={styles.grid}>
            {BLOCK_COLORS.map((c, i) => {
              const isActive = (activeBlock === i);
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  style={[
                    styles.block,
                    {
                      backgroundColor: c,
                      opacity: isActive ? 1 : gameState === 'showing' ? 0.35 : 0.85,
                      transform: [{ scale: isActive ? 1.08 : 1.0 }],
                      borderWidth: isActive ? 4 : 0,
                      borderColor: '#fff',
                    },
                  ]}
                  onPress={() => handleTap(i)}
                  disabled={gameState !== 'playing'}
                />
              );
            })}
          </View>
          
          {gameState === 'finished' && (
            <View style={styles.resultsOverlay}>
              <View style={styles.resultsCard}>
                <Ionicons name="trophy" size={48} color={Colors.light.primary} style={{ marginBottom: Spacing.two }} />
                <Text style={styles.resTitle}>Activity Complete</Text>
                <Text style={styles.resScore}>
                  {successfulRounds} / {TOTAL_ROUNDS} Correct Sequences
                </Text>
                <Text style={styles.resPts}>{scorePct} pts ({tapAccuracy}% Tap Accuracy)</Text>
                <Text style={styles.resSeq}>Highest Sequence: {maxLevel} blocks</Text>
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
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
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
  hintContainer: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 220,
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  block: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 24,
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
  resSeq: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.six,
    fontWeight: '600',
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
