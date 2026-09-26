import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function DirectionMatchGame({ visible, onClose, onResult }: any) {
  const [gameState, setGameState] = useState('idle');
  const [arrow, setArrow] = useState('arrow-up');
  const [isIncongruent, setIsIncongruent] = useState(false);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);

  const arrows = ['arrow-up', 'arrow-down', 'arrow-back', 'arrow-forward'];

  useEffect(() => {
    if (visible && gameState === 'idle') {
      nextRound();
    }
  }, [visible, gameState]);

  const nextRound = () => {
    if (round >= 10) {
      setGameState('finished');
      return;
    }
    setArrow(arrows[Math.floor(Math.random() * 4)]);
    setIsIncongruent(Math.random() > 0.5);
    setGameState('playing');
  };

  const handleTap = (dir: string) => {
    let target = arrow;
    if (isIncongruent) {
      if (arrow === 'arrow-up') target = 'arrow-down';
      if (arrow === 'arrow-down') target = 'arrow-up';
      if (arrow === 'arrow-back') target = 'arrow-forward';
      if (arrow === 'arrow-forward') target = 'arrow-back';
    }
    
    if (dir === target) setHits(h => h + 1);
    setRound(r => r + 1);
    nextRound();
  };

  const finish = () => {
    if (onResult) {
      onResult({
        activityType: 'direction_match',
        score: hits,
        accuracy: hits / 10,
        durationMs: 15000,
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
          <Text style={styles.title}>Direction Match</Text>
          <Text style={styles.subtitle}>
            If MATCH: tap the direction shown. {'\n'}
            If OPPOSITE: tap the opposite direction.
          </Text>
          
          <View style={styles.gameArea}>
            <View style={[styles.ruleBox, { backgroundColor: isIncongruent ? Colors.light.stateSustained : Colors.light.accent }]}>
              <Text style={styles.ruleText}>{isIncongruent ? 'OPPOSITE' : 'MATCH'}</Text>
            </View>
            <Ionicons name={arrow as any} size={80} color={Colors.light.navy} />
          </View>
          
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.btnDir} onPress={() => handleTap('arrow-up')}><Ionicons name="arrow-up" size={32} color="#fff" /></TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.btnDir} onPress={() => handleTap('arrow-back')}><Ionicons name="arrow-back" size={32} color="#fff" /></TouchableOpacity>
              <View style={{ width: 64 }} />
              <TouchableOpacity style={styles.btnDir} onPress={() => handleTap('arrow-forward')}><Ionicons name="arrow-forward" size={32} color="#fff" /></TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.btnDir} onPress={() => handleTap('arrow-down')}><Ionicons name="arrow-down" size={32} color="#fff" /></TouchableOpacity>
            </View>
          </View>
          
          {gameState === 'finished' && (
            <View style={styles.results}>
              <Text style={styles.resText}>Score: {hits} / 10</Text>
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
  gameArea: { alignItems: 'center', marginBottom: Spacing.eight },
  ruleBox: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: Spacing.four },
  ruleText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  controls: { width: 240, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.two },
  btnDir: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  results: { alignItems: 'center', position: 'absolute', backgroundColor: 'rgba(255,255,255,0.95)', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', borderRadius: Radius.lg },
  resText: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text, marginBottom: Spacing.four },
  btn: { backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: Radius.full },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { marginTop: Spacing.six },
  closeText: { color: Colors.light.textMuted, fontSize: 14 }
});
