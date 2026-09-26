import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

export interface NetworkNode {
  id: string;
  name: string;
  unit: string;
  role: string;
  x: number;
  y: number;
  workload: number; // 1-5, controls node radius
  deviationState: 'stable' | 'emerging' | 'persistent' | 'sustained';
  clusterId: number;
  recoveryDebt: number; // 0-100
  recentTrend: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  sharedShifts: number;
  isCoMoving: boolean; // synchronized deterioration
}

const DEFAULT_NODES: NetworkNode[] = [
  // Cluster 1: Alpha Patrol (Training Wing - High Resonance)
  { id: 'p1', name: 'HC Vikram', unit: 'Training Wing', role: 'Head Constable', x: 75, y: 70, workload: 4.8, deviationState: 'sustained', clusterId: 1, recoveryDebt: 78, recentTrend: '↑ +24% Load' },
  { id: 'p2', name: 'CT Rohan', unit: 'Training Wing', role: 'Constable', x: 135, y: 50, workload: 4.5, deviationState: 'persistent', clusterId: 1, recoveryDebt: 72, recentTrend: '↑ +18% Load' },
  { id: 'p3', name: 'CT Amit', unit: 'Training Wing', role: 'Constable', x: 125, y: 125, workload: 4.2, deviationState: 'persistent', clusterId: 1, recoveryDebt: 68, recentTrend: '↑ +15% Load' },
  { id: 'p4', name: 'ASI Manoj', unit: 'Training Wing', role: 'ASI', x: 65, y: 140, workload: 4.6, deviationState: 'sustained', clusterId: 1, recoveryDebt: 75, recentTrend: '↑ +21% Load' },

  // Cluster 2: Bravo Shift (Central Ops - Emerging)
  { id: 'p5', name: 'SI Priya', unit: 'Central Ops', role: 'Sub-Inspector', x: 235, y: 65, workload: 3.8, deviationState: 'emerging', clusterId: 2, recoveryDebt: 54, recentTrend: '→ Moderate' },
  { id: 'p6', name: 'CT Suresh', unit: 'Central Ops', role: 'Constable', x: 285, y: 95, workload: 3.5, deviationState: 'stable', clusterId: 2, recoveryDebt: 38, recentTrend: '↓ Recovering' },
  { id: 'p7', name: 'CT Neha', unit: 'Central Ops', role: 'Constable', x: 230, y: 145, workload: 3.9, deviationState: 'emerging', clusterId: 2, recoveryDebt: 58, recentTrend: '↑ Night Shifts' },

  // Cluster 3: Charlie Guard (North Zone - Stable)
  { id: 'p8', name: 'Inspector Roy', unit: 'North Zone', role: 'Inspector', x: 105, y: 225, workload: 2.8, deviationState: 'stable', clusterId: 3, recoveryDebt: 28, recentTrend: '→ Normal' },
  { id: 'p9', name: 'CT Karan', unit: 'North Zone', role: 'Constable', x: 60, y: 255, workload: 2.5, deviationState: 'stable', clusterId: 3, recoveryDebt: 22, recentTrend: '→ Normal' },
  { id: 'p10', name: 'CT Deepa', unit: 'North Zone', role: 'Constable', x: 155, y: 265, workload: 3.0, deviationState: 'stable', clusterId: 3, recoveryDebt: 31, recentTrend: '→ Normal' },

  // Cluster 4: Delta Response (Deployment Unit - Recovering)
  { id: 'p11', name: 'ASI Khan', unit: 'Deployment Unit', role: 'ASI', x: 245, y: 235, workload: 3.4, deviationState: 'emerging', clusterId: 4, recoveryDebt: 48, recentTrend: '↓ Post-Op Rest' },
  { id: 'p12', name: 'CT Rakesh', unit: 'Deployment Unit', role: 'Constable', x: 295, y: 260, workload: 3.2, deviationState: 'stable', clusterId: 4, recoveryDebt: 34, recentTrend: '↓ Post-Op Rest' },
];

const DEFAULT_EDGES: NetworkEdge[] = [
  // Cluster 1 (high resonance - red/orange co-movement)
  { source: 'p1', target: 'p2', sharedShifts: 14, isCoMoving: true },
  { source: 'p2', target: 'p3', sharedShifts: 12, isCoMoving: true },
  { source: 'p3', target: 'p4', sharedShifts: 15, isCoMoving: true },
  { source: 'p4', target: 'p1', sharedShifts: 16, isCoMoving: true },
  { source: 'p1', target: 'p3', sharedShifts: 10, isCoMoving: true },

  // Cluster 2
  { source: 'p5', target: 'p6', sharedShifts: 11, isCoMoving: false },
  { source: 'p5', target: 'p7', sharedShifts: 13, isCoMoving: true },
  { source: 'p6', target: 'p7', sharedShifts: 9, isCoMoving: false },

  // Cluster 3
  { source: 'p8', target: 'p9', sharedShifts: 10, isCoMoving: false },
  { source: 'p8', target: 'p10', sharedShifts: 12, isCoMoving: false },
  { source: 'p9', target: 'p10', sharedShifts: 8, isCoMoving: false },

  // Cluster 4
  { source: 'p11', target: 'p12', sharedShifts: 14, isCoMoving: false },

  // Cross-cluster duty liaison
  { source: 'p2', target: 'p5', sharedShifts: 4, isCoMoving: false },
  { source: 'p4', target: 'p8', sharedShifts: 3, isCoMoving: false },
  { source: 'p7', target: 'p11', sharedShifts: 5, isCoMoving: false },
];

const STATE_COLORS: Record<string, string> = {
  stable: '#10B981',    // Emerald Green
  emerging: '#F59E0B',  // Amber Yellow
  persistent: '#F97316',// Orange
  sustained: '#EF4444', // Red
};

export default function TeamNetworkGraph() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(DEFAULT_NODES[0]);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | null>(null);

  const filteredNodes = selectedClusterFilter
    ? DEFAULT_NODES.filter(n => n.clusterId === selectedClusterFilter)
    : DEFAULT_NODES;

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredEdges = DEFAULT_EDGES.filter(
    e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  const nodeMap = new Map(DEFAULT_NODES.map(n => [n.id, n]));

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="git-network" size={20} color={Colors.light.navy} />
          <Text style={styles.cardTitle}>TEAM STRESS NETWORK & RESONANCE</Text>
        </View>
        <View style={styles.resonanceBadge}>
          <Ionicons name="pulse" size={14} color="#EF4444" />
          <Text style={styles.resonanceText}>CLUSTER 1 HIGH RESONANCE</Text>
        </View>
      </View>

      <Text style={styles.subText}>
        Visualizes synchronized welfare changes across connected rosters. Nodes = personnel, Edges = shared shifts, Glowing Edges = synchronized deterioration.
      </Text>

      {/* Cluster Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, selectedClusterFilter === null && styles.filterBtnActive]}
          onPress={() => setSelectedClusterFilter(null)}
        >
          <Text style={[styles.filterBtnText, selectedClusterFilter === null && styles.filterBtnTextActive]}>
            All Units (12)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedClusterFilter === 1 && styles.filterBtnActive]}
          onPress={() => setSelectedClusterFilter(1)}
        >
          <Text style={[styles.filterBtnText, selectedClusterFilter === 1 && styles.filterBtnTextActive]}>
            Training Wing (Resonance)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedClusterFilter === 2 && styles.filterBtnActive]}
          onPress={() => setSelectedClusterFilter(2)}
        >
          <Text style={[styles.filterBtnText, selectedClusterFilter === 2 && styles.filterBtnTextActive]}>
            Central Ops
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedClusterFilter === 3 && styles.filterBtnActive]}
          onPress={() => setSelectedClusterFilter(3)}
        >
          <Text style={[styles.filterBtnText, selectedClusterFilter === 3 && styles.filterBtnTextActive]}>
            North Zone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedClusterFilter === 4 && styles.filterBtnActive]}
          onPress={() => setSelectedClusterFilter(4)}
        >
          <Text style={[styles.filterBtnText, selectedClusterFilter === 4 && styles.filterBtnTextActive]}>
            Deployment Unit
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Graph Canvas */}
      <View style={styles.svgContainer}>
        <Svg width="100%" height={320} viewBox="0 0 360 320">
          {/* Cluster boundary highlights */}
          {selectedClusterFilter === null || selectedClusterFilter === 1 ? (
            <Rect
              x={40}
              y={25}
              width={125}
              height={140}
              rx={16}
              fill="rgba(239, 68, 68, 0.08)"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeDasharray="4,4"
              strokeWidth={1.5}
            />
          ) : null}

          {selectedClusterFilter === null || selectedClusterFilter === 2 ? (
            <Rect
              x={205}
              y={40}
              width={110}
              height={130}
              rx={16}
              fill="rgba(245, 158, 11, 0.06)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeDasharray="4,4"
              strokeWidth={1}
            />
          ) : null}

          {/* Cluster labels */}
          {(selectedClusterFilter === null || selectedClusterFilter === 1) && (
            <SvgText x={48} y={42} fontSize={9} fontWeight="bold" fill="#EF4444">
              Cluster 1 (Alert)
            </SvgText>
          )}
          {(selectedClusterFilter === null || selectedClusterFilter === 2) && (
            <SvgText x={212} y={56} fontSize={9} fontWeight="bold" fill="#D97706">
              Cluster 2
            </SvgText>
          )}

          {/* Render Edges */}
          {filteredEdges.map((e, idx) => {
            const src = nodeMap.get(e.source);
            const tgt = nodeMap.get(e.target);
            if (!src || !tgt) return null;

            const strokeColor = e.isCoMoving
              ? '#EF4444' // Glowing red for synchronized deterioration
              : '#94A3B8'; // Subtle slate for normal connection
            const strokeWidth = e.isCoMoving ? 3 : Math.max(1, e.sharedShifts / 5);
            const strokeOpacity = e.isCoMoving ? 0.9 : 0.4;

            return (
              <Line
                key={`edge-${idx}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeDasharray={e.isCoMoving ? undefined : '2,2'}
              />
            );
          })}

          {/* Render Nodes */}
          {filteredNodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const radius = 10 + node.workload * 2.2;
            const color = STATE_COLORS[node.deviationState] || '#64748B';

            return (
              <G key={node.id} onPress={() => setSelectedNode(node)}>
                {/* Selection halo */}
                {isSelected && (
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 6}
                    fill="none"
                    stroke={Colors.light.navy}
                    strokeWidth={2.5}
                    strokeDasharray="3,3"
                  />
                )}
                {/* Node circle */}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {/* Initials label */}
                <SvgText
                  x={node.x}
                  y={node.y + 4}
                  fontSize={10}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {node.name.split(' ').map(w => w[0]).join('')}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATE_COLORS.stable }]} />
          <Text style={styles.legendText}>Stable</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATE_COLORS.emerging }]} />
          <Text style={styles.legendText}>Emerging</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATE_COLORS.persistent }]} />
          <Text style={styles.legendText}>Persistent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATE_COLORS.sustained }]} />
          <Text style={styles.legendText}>Sustained</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Co-Moving</Text>
        </View>
      </View>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View>
              <Text style={styles.detailName}>{selectedNode.name}</Text>
              <Text style={styles.detailRole}>
                {selectedNode.role} · {selectedNode.unit}
              </Text>
            </View>
            <View
              style={[
                styles.stateBadge,
                { backgroundColor: STATE_COLORS[selectedNode.deviationState] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.stateBadgeText,
                  { color: STATE_COLORS[selectedNode.deviationState] },
                ]}
              >
                {selectedNode.deviationState.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailMetricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Workload Exposure</Text>
              <Text style={styles.metricVal}>{selectedNode.workload.toFixed(1)} / 5.0</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Recovery Debt</Text>
              <Text
                style={[
                  styles.metricVal,
                  {
                    color:
                      selectedNode.recoveryDebt > 60
                        ? '#EF4444'
                        : selectedNode.recoveryDebt > 40
                        ? '#F59E0B'
                        : '#10B981',
                  },
                ]}
              >
                {selectedNode.recoveryDebt}%
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>30-Day Trend</Text>
              <Text style={styles.metricVal}>{selectedNode.recentTrend}</Text>
            </View>
          </View>

          {selectedNode.clusterId === 1 && (
            <View style={styles.resonanceAlertBox}>
              <Ionicons name="warning" size={16} color="#DC2626" />
              <Text style={styles.resonanceAlertText}>
                <Text style={{ fontWeight: 'bold' }}>Cluster 1 Resonance: </Text>
                Connected teammates ({DEFAULT_NODES.filter(n => n.clusterId === 1).map(n => n.name).join(', ')}) exhibit synchronized recovery deficit following high-density night shifts.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: Spacing.six,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
  },
  resonanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  resonanceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  subText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.three,
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  filterBtnActive: {
    backgroundColor: Colors.light.navy,
    borderColor: Colors.light.navy,
  },
  filterBtnText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  svgContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  detailName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  detailRole: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  resonanceAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.two,
    borderRadius: Radius.sm,
    marginTop: Spacing.two,
  },
  resonanceAlertText: {
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
    lineHeight: 15,
  },
});
