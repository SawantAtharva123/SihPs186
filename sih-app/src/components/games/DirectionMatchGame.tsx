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
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [arrow, setArrow] = useState<ArrowType>('arrow-up');
  const [isIncongruent, setIsIncongruent] = useState(false);
  const [round, setRound] = useState(0); // 0 to TOTAL_ROUNDS
  const [hits, setHits] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const setupNextRound = () => {
    const nextArrow = ARROWS[Math.floor(Math.random() * ARROWS.length)];
    const nextIncongruent = Math.random() > 0.5;
    setArrow(nextArrow);
    setIsIncongruent(nextIncongruent);
    startTimeRef.current = Date.now();
  };

  const startNewGame = () => {
    setRound(0);
    setHits(0);
    setReactionTimes([]);
    setupNextRound();
    setGameState('playing');
  };

  useEffect(() => {
    if (visible) {
      startNewGame();
    } else {
      setGameState('idle');
    }
  }, [visible]);

  const handleTap = (dir: ArrowType) => {
    if (gameState !== 'playing') return;

    const rt = Date.now() - startTimeRef.current;
    const target = isIncongruent ? getOpposite(arrow) : arrow;
    const isCorrect = (dir === target);

    const nextHits = isCorrect ? hits + 1 : hits;
    const nextRound = round + 1;
    const updatedRTs = [...reactionTimes, rt];

    setHits(nextHits);
    setRound(nextRound);
    setReactionTimes(updatedRTs);

    if (nextRound >= TOTAL_ROUNDS) {
      setGameState('finished');
      return;
    }

    setupNextRound();
  };

  const finish = () => {
    if (onResult) {
      const score = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
      const accuracy = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
      const avgRT = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      const totalDuration = reactionTimes.reduce((a, b) => a + b, 0);

      onResult({
        activityType: 'direction_match',
        score,
        accuracy,
        avgReactionTimeMs: avgRT,
        reactionVariabilityMs: 0,
        correctAnswers: hits,
        incorrectAnswers: TOTAL_ROUNDS - hits,
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

          <Text style={styles.subtitle}>
            If <Text style={styles.bold}>MATCH</Text>: tap arrow pointing the same direction.{'\n'}
            If <Text style={styles.bold}>OPPOSITE</Text>: tap arrow pointing the opposite direction.
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
          </View>
          
          <View style={styles.gameArea}>
            <View style={[
              styles.ruleBox,
              { backgroundColor: isIncongruent ? Colors.light.stateSustained : Colors.light.accent }
            ]}>
              <Text style={styles.ruleText}>{isIncongruent ? 'OPPOSITE' : 'MATCH'}</Text>
            </View>
            <Ionicons name={arrow as any} size={84} color={Colors.light.navy} />
          </View>
          
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.btnDir}
                onPress={() => handleTap('arrow-up')}
                disabled={gameState !== 'playing'}
              >
                <Ionicons name="arrow-up" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.btnDir}
                onPress={() => handleTap('arrow-back')}
                disabled={gameState !== 'playing'}
              >
                <Ionicons name="arrow-back" size={32} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 64 }} />
              <TouchableOpacity
                style={styles.btnDir}
                onPress={() => handleTap('arrow-forward')}
                disabled={gameState !== 'playing'}
              >
                <Ionicons name="arrow-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.btnDir}
                onPress={() => handleTap('arrow-down')}
                disabled={gameState !== 'playing'}
              >
                <Ionicons name="arrow-down" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
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
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.three,
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
    marginBottom: Spacing.six,
  },
  ruleBox: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.three,
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
