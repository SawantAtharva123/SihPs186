import React, { useState, useEffect } from 'react';
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
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [grid, setGrid] = useState<any[]>([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTimes, setElapsedTimes] = useState<number[]>([]);

  const generateRound = () => {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    setOddIndex(idx);
    
    // Create subtle difference for odd one out
    const items = Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      color: i === idx ? Colors.light.accent : Colors.light.primary,
      borderRadius: i === idx ? 25 : 8,
    }));
    
    setGrid(items);
    setStartTime(Date.now());
  };

  const startNewGame = () => {
    setRound(0);
    setHits(0);
    setElapsedTimes([]);
    generateRound();
    setGameState('playing');
  };

  useEffect(() => {
    if (visible) {
      startNewGame();
    } else {
      setGameState('idle');
    }
  }, [visible]);

  const handleTap = (index: number) => {
    if (gameState !== 'playing') return;

    const rt = Date.now() - startTime;
    const isCorrect = (index === oddIndex);
    const nextHits = isCorrect ? hits + 1 : hits;
    const nextRound = round + 1;
    const nextTimes = [...elapsedTimes, rt];

    setHits(nextHits);
    setRound(nextRound);
    setElapsedTimes(nextTimes);

    if (nextRound >= TOTAL_ROUNDS) {
      setGameState('finished');
      return;
    }

    generateRound();
  };

  const finish = () => {
    if (onResult) {
      const score = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
      const accuracy = Math.min(100, Math.max(0, Math.round((hits / TOTAL_ROUNDS) * 100)));
      const avgRT = elapsedTimes.length > 0
        ? Math.round(elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length)
        : 0;
      const totalDuration = elapsedTimes.reduce((a, b) => a + b, 0);

      onResult({
        activityType: 'odd_one_out',
        score,
        accuracy,
        avgReactionTimeMs: avgRT,
        reactionVariabilityMs: 0,
        correctAnswers: hits,
        incorrectAnswers: TOTAL_ROUNDS - hits,
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
          </View>
          
          <View style={styles.grid}>
            {grid.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                style={[
                  styles.item,
                  { backgroundColor: item.color, borderRadius: item.borderRadius },
                ]}
                onPress={() => handleTap(i)}
                disabled={gameState !== 'playing'}
              />
            ))}
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
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.five,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
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
