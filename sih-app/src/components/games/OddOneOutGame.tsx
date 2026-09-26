import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function OddOneOutGame({ visible, onClose, onResult }: any) {
  const [gameState, setGameState] = useState('idle');
  const [grid, setGrid] = useState<any[]>([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);

  useEffect(() => {
    if (visible && gameState === 'idle') {
      nextRound();
    }
  }, [visible, gameState]);

  const nextRound = () => {
    if (round >= 5) {
      setGameState('finished');
      return;
    }
    const idx = Math.floor(Math.random() * 16);
    setOddIndex(idx);
    
    const items = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      color: i === idx ? Colors.light.accent : Colors.light.primary,
      borderRadius: i === idx ? 25 : 0
    }));
    
    setGrid(items);
    setGameState('playing');
  };

  const handleTap = (index: number) => {
    if (index === oddIndex) {
      setHits(h => h + 1);
    }
    setRound(r => r + 1);
    nextRound();
  };

  const finish = () => {
    if (onResult) {
      onResult({
        activityType: 'odd_one_out',
        score: hits,
        accuracy: hits / 5,
        durationMs: 20000,
        correctAnswers: hits,
      });
    }
    setGameState('idle');
    setRound(0);
    setHits(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Odd One Out</Text>
          <Text style={styles.subtitle}>Find and tap the item that looks different.</Text>
          
          <View style={styles.grid}>
            {grid.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.item, { backgroundColor: item.color, borderRadius: item.borderRadius }]}
                onPress={() => handleTap(i)}
              />
            ))}
          </View>
          
          {gameState === 'finished' && (
            <View style={styles.results}>
              <Text style={styles.resText}>Score: {hits} / 5</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'space-between' },
  item: { width: 50, height: 50, marginBottom: Spacing.two },
  results: { alignItems: 'center', marginTop: Spacing.six },
  resText: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  btn: { backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: Radius.full },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { marginTop: Spacing.six },
  closeText: { color: Colors.light.textMuted, fontSize: 14 }
});
