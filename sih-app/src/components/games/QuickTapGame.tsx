import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuickTapGame({ visible, onClose, onResult }: { visible: boolean, onClose: () => void, onResult?: (result: any) => void }) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'finished'>('idle');
  const [message, setMessage] = useState('Tap when the screen turns GREEN');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setGameState('waiting');
    setMessage('Wait for green...');
    
    // Random delay between 2 to 5 seconds
    const delay = Math.floor(Math.random() * 3000) + 2000;
    
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      setMessage('TAP NOW!');
      setStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      // False start
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage('Too soon! Wait for green.');
      setGameState('idle');
    } else if (gameState === 'ready') {
      const endTime = Date.now();
      const rt = endTime - startTime;
      const newTimes = [...reactionTimes, rt];
      setReactionTimes(newTimes);
      
      if (newTimes.length >= 3) {
        setGameState('finished');
        setMessage('Activity Complete');
      } else {
        setMessage(`Great! ${rt}ms`);
        setGameState('idle');
      }
    }
  };

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setGameState('idle');
    setMessage('Tap when the screen turns GREEN');
    setReactionTimes([]);
  };

  const getBackgroundColor = () => {
    if (gameState === 'waiting') return Colors.light.stateSustained; // Red
    if (gameState === 'ready') return Colors.light.stateStable; // Green
    return Colors.light.backgroundElement;
  };

  const avgRT = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
    : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { resetGame(); onClose(); }} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={gameState === 'idle' || gameState === 'finished' ? Colors.light.text : '#fff'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.touchArea} 
          activeOpacity={1} 
          onPress={gameState === 'idle' ? startRound : handleTap}
        >
          <View style={styles.content}>
            <Text style={[
              styles.mainText, 
              (gameState === 'waiting' || gameState === 'ready') && { color: '#fff' }
            ]}>
              {message}
            </Text>
            
            {gameState === 'idle' && reactionTimes.length > 0 && reactionTimes.length < 3 && (
              <Text style={styles.subText}>Tap anywhere to start round {reactionTimes.length + 1}</Text>
            )}

            {gameState === 'idle' && reactionTimes.length === 0 && (
              <Text style={styles.subText}>Tap anywhere to begin</Text>
            )}

            {gameState === 'finished' && (
              <View style={styles.resultsCard}>
                <Text style={styles.resultTitle}>Results</Text>
                <Text style={styles.resultValue}>Avg Reaction Time: {avgRT}ms</Text>
                <Text style={styles.resultSubtitle}>Baseline Comparison: Normal</Text>
                
                <TouchableOpacity style={styles.saveBtn} onPress={() => {
                    if (onResult) {
                      const variability = reactionTimes.length > 1
                        ? Math.round(Math.sqrt(reactionTimes.map(t => Math.pow(t - avgRT, 2)).reduce((a, b) => a + b, 0) / reactionTimes.length))
                        : 0;
                      onResult({
                        score: Math.max(0, 100 - Math.round(avgRT / 10)),
                        accuracy: 100,
                        avgReactionTimeMs: avgRT,
                        reactionVariabilityMs: variability,
                        correctAnswers: reactionTimes.length,
                        incorrectAnswers: 0,
                        missedAnswers: 0,
                        durationMs: reactionTimes.reduce((a, b) => a + b, 0),
                      });
                    }
                    resetGame();
                    onClose();
                  }}>
                  <Text style={styles.saveBtnText}>Save & Exit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.four, alignItems: 'flex-end', zIndex: 10 },
  closeBtn: { padding: Spacing.two },
  touchArea: { flex: 1, width: '100%', height: '100%' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  mainText: { fontSize: 28, fontWeight: 'bold', color: Colors.light.navy, textAlign: 'center', marginBottom: Spacing.four },
  subText: { fontSize: 18, color: Colors.light.textSecondary, textAlign: 'center' },
  resultsCard: {
    backgroundColor: '#fff',
    padding: Spacing.six,
    borderRadius: Radius.lg,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  resultTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: Spacing.four },
  resultValue: { fontSize: 18, color: Colors.light.primary, fontWeight: 'bold', marginBottom: Spacing.two },
  resultSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: Spacing.six },
  saveBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.six, paddingVertical: Spacing.three, borderRadius: Radius.full },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
