export type UserRole = 'personnel' | 'welfare_officer' | 'command_admin';

export type WelfareState = 
  | 'Stable'
  | 'Emerging Change'
  | 'Persistent Deviation'
  | 'Sustained Concern'
  | 'Conflicting Signals';

export type DemoScenario = 
  | 'scenario_a_stable'
  | 'scenario_b_emerging_change'
  | 'scenario_c_persistent_deviation'
  | 'scenario_d_conflicting_signals'
  | 'scenario_e_recovery_journey'
  | 'scenario_f_high_volatility';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

export interface PersonnelProfile {
  id: string;
  name: string;
  serviceNumber: string;
  unit: string;
  rank: string;
  role: string;
  avatar: string;
  currentState: WelfareState;
  stateExplanation: string;
  baselineDays: number;
  baselineConfidence: number; // 0 to 100
  confidenceLabel: 'Learning' | 'Moderate' | 'Established';
  recoveryDebt: number; // e.g. +12
  recoveryTrajectory: 'Improving' | 'Stable' | 'Accumulating';
  estimatedHalfLifeDays: number;
  lastCheckInDate?: string;
  signalsAgreement: 'High' | 'Moderate' | 'Conflicting';
  buddy: {
    name: string;
    rank: string;
    status: 'Available' | 'On Duty' | 'Leave';
    lastContact: string;
  };
  welfareOfficer: {
    name: string;
    rank: string;
    unit: string;
    status: 'Available' | 'In Meeting';
  };
}

export interface MetricTrendPoint {
  date: string;
  value: number;
  baseline: number;
  deviation: number;
}

export interface PersonnelTrendsData {
  sleep: MetricTrendPoint[];
  workload: MetricTrendPoint[];
  recovery: MetricTrendPoint[];
  dutyHours: MetricTrendPoint[];
  nightShifts: MetricTrendPoint[];
  restIntervals: MetricTrendPoint[];
  routineVolatility: MetricTrendPoint[];
  cumulativeLoad: MetricTrendPoint[];
}

export interface DailyCheckInRecord {
  id: string;
  date: string;
  sleepCompared: 'Much lower' | 'Lower' | 'Usual' | 'Higher' | 'Much higher';
  workloadCompared: 'Much lower' | 'Lower' | 'Usual' | 'Higher' | 'Much higher';
  energyLevel: 'Low' | 'Mild' | 'Usual' | 'Energetic' | 'Peak';
  recoveryFeeling: 'Strained' | 'Slow' | 'Normal' | 'Restored' | 'Fully recharged';
  note?: string;
  syncStatus: SyncStatus;
  timestamp: string;
}

export interface ActivityResult {
  id: string;
  activityType: 'quick_tap' | 'go_no_go' | 'sequence_recall' | 'odd_one_out' | 'direction_match';
  title: string;
  score: number;
  accuracy: number;
  avgReactionTimeMs: number;
  reactionVariabilityMs: number;
  completedAt: string;
  syncStatus: SyncStatus;
}

export interface StressorNode {
  id: string;
  label: string;
  category: 'operational' | 'physiological' | 'fatigue' | 'outcome';
  currentVal: string;
  baselineVal: string;
  deviationText: string;
  deviationSeverity: 'normal' | 'moderate' | 'elevated';
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  isModelDerived?: boolean;
}

export interface RootCauseFactor {
  id: string;
  title: string;
  observedData: string;
  possibleContribution: string;
  evidence: string;
  confidence: 'Low' | 'Moderate' | 'High';
  period: string;
}

export interface WelfareCase {
  id: string;
  personnelId: string;
  personnelName: string;
  serviceNumber: string;
  unit: string;
  status: 'New' | 'Under Review' | 'Intervention Planned' | 'Follow-up' | 'Improving' | 'Closed';
  reasonCategory: 'Schedule' | 'Recovery' | 'Workload' | 'Support' | 'Other';
  observedPattern: string;
  possibleContributors: string[];
  officerNotes: string;
  followUpDate: string;
  createdAt: string;
  updatedAt: string;
  priority: 'Routine' | 'Priority' | 'Elevated';
}

export interface InterventionRecord {
  id: string;
  caseId: string;
  personnelId: string;
  personnelName: string;
  interventionType: 'Schedule adjustment' | 'Recovery period' | 'Duty redistribution' | 'Training adjustment' | 'Welfare check-in' | 'Support referral';
  plannedDate: string;
  startDate: string;
  endDate?: string;
  status: 'Planned' | 'Active' | 'Under Review' | 'Completed' | 'Adjusted';
  notes: string;
  recoveryBefore: number;
  recoveryAfter?: number;
  recoveryCurrent: number;
  baselineMovementPercent: number;
  outcomeStatus: 'Pending' | 'Improving' | 'Stable' | 'Requires further follow-up' | 'No observed change';
}

export interface UnitPulseData {
  unitName: string;
  recoveryTrend: 'Improving' | 'Stable' | 'Declining';
  recoveryScore: number;
  workloadIndex: number;
  scheduleVolatility: 'Low' | 'Moderate' | 'Elevated';
  participationRate: number; // e.g. 84%
  anonymityThresholdMet: boolean;
  sampleCount: number;
  recentThemes: {
    category: string;
    status: 'Favorable' | 'Neutral' | 'Attention Needed';
    mentionCount: number;
  }[];
}

export interface VoiceOfPersonnelSubmission {
  id: string;
  category: 'Schedule' | 'Workload' | 'Facility' | 'Team' | 'Safety' | 'Welfare' | 'Other';
  isAnonymous: boolean;
  requestWelfareFollowUp: boolean;
  content: string;
  unit: string;
  createdAt: string;
  status: 'Submitted' | 'Under Review' | 'Addressed';
}

export interface UnitOverviewItem {
  id: string;
  name: string;
  weatherState: 'Stable' | 'Emerging Change' | 'Elevated Recovery Pressure' | 'Improving';
  weatherIcon: 'sunny' | 'partly_cloudy' | 'rainy' | 'recovering';
  headcount: number;
  recoveryPressure: number;
  scheduleVolatility: 'Low' | 'Moderate' | 'High';
  cumulativeLoad: number;
  unitPulseScore: number;
  nightShiftChangePercent: number;
  restIntervalChangePercent: number;
  dutyVariabilityPercent: number;
  consecutiveDutyPercent: number;
}
