import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

type GameState = 'idle' | 'playing' | 'showing_stimulus' | 'finished';
type StimulusType = 'go' | 'nogo';

interface Trial {
  type: StimulusType;
  tapped: boolean;
  reactionTimeMs: number | null;
}

interface GameResult {
  score: number;
  accuracy: number;
  avgReactionTimeMs: number;
  correctAnswers: number;
  incorrectAnswers: number;
  missedAnswers: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: GameResult) => void;
}

const TOTAL_TRIALS = 15;
const STIMULUS_DURATION_MS = 600;
const MIN_INTERVAL_MS = 800;
const MAX_INTERVAL_MS = 1500;
const GO_RATIO = 0.7;

function generateTrials(): StimulusType[] {
  const trials: StimulusType[] = [];
  const goCount = Math.round(TOTAL_TRIALS * GO_RATIO);
  for (let i = 0; i < goCount; i++) trials.push('go');
  for (let i = goCount; i < TOTAL_TRIALS; i++) trials.push('nogo');
  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

function computeResult(trials: Trial[]): GameResult {
  const safeTrials = trials.slice(0, TOTAL_TRIALS);
  const goTrials = safeTrials.filter((t) => t.type === 'go');
  const nogoTrials = safeTrials.filter((t) => t.type === 'nogo');

  const hits = goTrials.filter((t) => t.tapped).length;
  const misses = goTrials.filter((t) => !t.tapped).length;
  const falseAlarms = nogoTrials.filter((t) => t.tapped).length;
  const correctRejections = nogoTrials.filter((t) => !t.tapped).length;

  const correctTotal = hits + correctRejections;
  const accuracy = Math.min(100, Math.max(0, Math.round((correctTotal / TOTAL_TRIALS) * 100)));

  const rts = safeTrials
    .filter((t) => t.tapped && t.type === 'go' && t.reactionTimeMs !== null)
    .map((t) => t.reactionTimeMs as number);
  const avgRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;

  const rawScore = accuracy - (falseAlarms * 5) - (misses * 2);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score,
    accuracy,
    avgReactionTimeMs: avgRT,
    correctAnswers: Math.min(TOTAL_TRIALS, correctTotal),
    incorrectAnswers: Math.min(TOTAL_TRIALS, falseAlarms),
    missedAnswers: Math.min(TOTAL_TRIALS, misses),
  };
}

export default function GoNoGoGame({ visible, onClose, onResult }: Props) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [trialList, setTrialList] = useState<StimulusType[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<StimulusType | null>(null);
  const [completedTrials, setCompletedTrials] = useState<Trial[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [circleScale] = useState(new Animated.Value(1));

  const stimulusStartTime = useRef<number>(0);
  const tappedInWindow = useRef(false);
  const lastTapReactionTime = useRef<number | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentStimulusRef = useRef<StimulusType | null>(null);
  const completedTrialsRef = useRef<Trial[]>([]);
  const isRunningRef = useRef(false);

  const clearAllTimeouts = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const finishGame = useCallback((trials: Trial[]) => {
    isRunningRef.current = false;
    clearAllTimeouts();
    const res = computeResult(trials);
    setResult(res);
    setCurrentStimulus(null);
    setGameState('finished');
    onResult?.(res);
  }, [onResult]);

  const runNextTrial = useCallback(
    (index: number, trials: StimulusType[], accumulated: Trial[]) => {
      if (index >= TOTAL_TRIALS) {
        finishGame(accumulated);
        return;
      }

      const interval =
        MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);

      const waitTimeout = setTimeout(() => {
        const stimType = trials[index];
        currentStimulusRef.current = stimType;
        tappedInWindow.current = false;
        lastTapReactionTime.current = null;
        stimulusStartTime.current = Date.now();
        setCurrentStimulus(stimType);
        setGameState('showing_stimulus');
        setFeedbackText('');

        Animated.sequence([
          Animated.timing(circleScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
          Animated.timing(circleScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        const hideTimeout = setTimeout(() => {
          const tapped = tappedInWindow.current;
          const rt = tapped ? lastTapReactionTime.current : null;
          const newTrial: Trial = { type: stimType, tapped, reactionTimeMs: rt };
          const nextAccumulated = [...accumulated, newTrial];
          completedTrialsRef.current = nextAccumulated;
          setCompletedTrials(nextAccumulated);
          setCurrentStimulus(null);
          setGameState('playing');
          runNextTrial(index + 1, trials, nextAccumulated);
        }, STIMULUS_DURATION_MS);

        timeouts.current.push(hideTimeout);
      }, interval);

      timeouts.current.push(waitTimeout);
    },
    [circleScale, finishGame]
  );

  const startGame = () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    clearAllTimeouts();
    const trials = generateTrials();
    setTrialList(trials);
    setCompletedTrials([]);
    completedTrialsRef.current = [];
    setCurrentTrialIndex(0);
    setResult(null);
    setFeedbackText('');
    setGameState('playing');
    runNextTrial(0, trials, []);
  };

  const handleTap = () => {
    if (gameState !== 'showing_stimulus') return;
    if (tappedInWindow.current) return;
    const now = Date.now();
    const rt = Math.max(10, now - stimulusStartTime.current);
    lastTapReactionTime.current = rt;
    tappedInWindow.current = true;
    const stimulus = currentStimulusRef.current;
    if (stimulus === 'go') {
      setFeedbackText('✓');
    } else {
      setFeedbackText('✗');
    }
  };

  const handleClose = () => {
    isRunningRef.current = false;
    clearAllTimeouts();
    setGameState('idle');
    setCurrentStimulus(null);
    setResult(null);
    setCompletedTrials([]);
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      isRunningRef.current = false;
      clearAllTimeouts();
      setGameState('idle');
      setCurrentStimulus(null);
      setResult(null);
      setCompletedTrials([]);
    }
  }, [visible]);

  const currentCount = Math.min(TOTAL_TRIALS, completedTrials.length);
  const progress = currentCount / TOTAL_TRIALS;

  const renderIdle = () => (
    <View style={styles.centerContent}>
      <Text style={styles.gameTitle}>Reaction Inhibition</Text>
      <Text style={styles.gameSubtitle}>Go / No-Go Task</Text>
      <View style={styles.instructionCard}>
        <Text style={styles.instructionHeading}>How it works</Text>
        <Text style={styles.instructionText}>
          A coloured circle will appear on screen.
        </Text>
        <View style={styles.instructionRow}>
          <View style={[styles.miniCircle, { backgroundColor: Colors.light.success }]} />
          <Text style={styles.instructionText}>  <Text style={styles.bold}>GREEN</Text> — Tap as quickly as you can</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={[styles.miniCircle, { backgroundColor: Colors.light.stateSustained }]} />
          <Text style={styles.instructionText}>  <Text style={styles.bold}>RED</Text> — Do NOT tap</Text>
        </View>
        <Text style={[styles.instructionText, { marginTop: Spacing.two }]}>
          15 trials · approx. 30 seconds
        </Text>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
        <Text style={styles.primaryButtonText}>Begin Assessment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaying = () => (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.gameArea}
      onPress={handleTap}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.trialCounter}>
          {currentCount} / {TOTAL_TRIALS}
        </Text>
      </View>

      <View style={styles.stimulusContainer}>
        {currentStimulus ? (
          <Animated.View
            style={[
              styles.stimulusCircle,
              {
                backgroundColor:
                  currentStimulus === 'go'
                    ? Colors.light.success
                    : Colors.light.stateSustained,
                transform: [{ scale: circleScale }],
              },
            ]}
          />
        ) : (
          <View style={styles.blankCircle} />
        )}
        {feedbackText ? (
          <Text
            style={[
              styles.feedbackText,
              {
                color:
                  feedbackText === '✓'
                    ? Colors.light.success
                    : Colors.light.stateSustained,
              },
            ]}
          >
            {feedbackText}
          </Text>
        ) : null}
      </View>

      <Text style={styles.tapHint}>
        {currentStimulus === 'go'
          ? 'TAP NOW!'
          : currentStimulus === 'nogo'
          ? 'HOLD...'
          : 'Get ready...'}
      </Text>
    </TouchableOpacity>
  );

  const renderFinished = () => {
    if (!result) return null;
    return (
      <View style={styles.centerContent}>
        <Text style={styles.gameTitle}>Assessment Complete</Text>
        <Text style={styles.gameSubtitle}>Reaction Inhibition Results</Text>

        <View style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{result.score} / 100</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Accuracy</Text>
            <Text style={styles.metricValue}>{result.accuracy}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg Reaction Time</Text>
            <Text style={styles.metricValue}>{result.avgReactionTimeMs} ms</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Correct Responses</Text>
            <Text style={[styles.metricValue, { color: Colors.light.success }]}>
              {result.correctAnswers}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>False Alarms (No-Go taps)</Text>
            <Text style={[styles.metricValue, { color: Colors.light.stateSustained }]}>
              {result.incorrectAnswers}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Missed Go Targets</Text>
            <Text style={[styles.metricValue, { color: Colors.light.warning }]}>
              {result.missedAnswers}
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Results reflect observed response patterns during this session only.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
          <Text style={styles.primaryButtonText}>Save & Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cognitive Activity</Text>
          <View style={{ width: 32 }} />
        </View>

        {gameState === 'idle' && renderIdle()}
        {(gameState === 'playing' || gameState === 'showing_stimulus') && renderPlaying()}
        {gameState === 'finished' && renderFinished()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.navy,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.navy,
    textAlign: 'center',
  },
  gameSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  instructionCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    width: '100%',
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.navy,
    marginBottom: Spacing.two,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  miniCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  bold: {
    fontWeight: '700',
    color: Colors.light.navy,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.six,
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.three,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  trialCounter: {
    marginTop: Spacing.one,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  stimulusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  stimulusCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  blankCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: '700',
    position: 'absolute',
    bottom: -40,
  },
  tapHint: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    width: '100%',
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.navy,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.three,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.navy,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
