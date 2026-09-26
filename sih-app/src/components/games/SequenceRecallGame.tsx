import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function SequenceRecallGame({ visible, onClose, onResult }: any) {
  const [gameState, setGameState] = useState('idle'); // idle, showing, playing, finished
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);

  const colors = [Colors.light.stateSustained, Colors.light.accent, Colors.light.success, Colors.light.warning];

  useEffect(() => {
    if (visible && gameState === 'idle') {
      startLevel(3);
    }
  }, [visible, gameState]);

  const startLevel = (len: number) => {
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setUserSequence([]);
    setGameState('showing');
    
    // Play sequence animation
    let i = 0;
    const interval = setInterval(() => {
      // flash logic would go here
      i++;
      if (i >= len) {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 800);
  };

  const handleTap = (index: number) => {
    if (gameState !== 'playing') return;
    
    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);
    
    // Check correctness
    if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) {
      // Wrong
      setAttempts(a => a + 1);
      if (attempts >= 4) {
        setGameState('finished');
      } else {
        startLevel(Math.max(3, level - 1));
      }
      return;
    }
    
    if (newUserSeq.length === sequence.length) {
      // Right
      setMaxLevel(Math.max(maxLevel, level));
      setAttempts(a => a + 1);
      if (attempts >= 4) {
        setGameState('finished');
      } else {
        setLevel(l => l + 1);
        startLevel(level + 1);
      }
    }
  };

  const finish = () => {
    if (onResult) {
      onResult({
        activityType: 'sequence_recall',
        score: maxLevel,
        accuracy: maxLevel / (attempts || 1),
        durationMs: 30000,
        correctAnswers: maxLevel,
      });
    }
    setGameState('idle');
    setLevel(3);
    setAttempts(0);
    setMaxLevel(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Sequence Recall</Text>
          <Text style={styles.subtitle}>Watch the sequence, then tap the blocks in the same order.</Text>
          
          <View style={styles.grid}>
            {colors.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.block, { backgroundColor: c, opacity: gameState === 'playing' ? 1 : 0.5 }]}
                onPress={() => handleTap(i)}
                disabled={gameState !== 'playing'}
              />
            ))}
          </View>
          
          {gameState === 'finished' && (
            <View style={styles.results}>
              <Text style={styles.resText}>Max Sequence: {maxLevel}</Text>
              <TouchableOpacity style={styles.btn} onPress={finish}>
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  card: { backgroundColor: Colors.light.background, padding: Spacing.six, borderRadius: Radius.lg, width: '100%', maxWidth: 400, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.navy, marginBottom: Spacing.two },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: Spacing.six },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 220, justifyContent: 'space-between', marginBottom: Spacing.six },
  block: { width: 100, height: 100, borderRadius: Radius.md, marginBottom: Spacing.four },
  results: { alignItems: 'center', marginBottom: Spacing.six },
  resText: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  btn: { backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: Radius.full },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { marginTop: Spacing.two },
  closeText: { color: Colors.light.textMuted, fontSize: 14 }
});
