import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Flame, Clock, Footprints } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';

export const ActivityRings: React.FC = () => {
  const { dailySummary } = useFitnessStore();

  const size = 150;
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 3;

  // Radii for 3 concentric rings
  const r1 = center - strokeWidth / 2 - 4; // Move (Red)
  const r2 = r1 - strokeWidth - gap; // Exercise (Green)
  const r3 = r2 - strokeWidth - gap; // Stand / Steps (Cyan)

  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;

  const movePct = Math.min(1.5, dailySummary.activeCalories / dailySummary.calorieGoal);
  const exercisePct = Math.min(1.5, dailySummary.activeMinutes / dailySummary.activeMinutesGoal);
  const stepPct = Math.min(1.5, dailySummary.steps / dailySummary.stepGoal);

  const offset1 = c1 - c1 * Math.min(1, movePct);
  const offset2 = c2 - c2 * Math.min(1, exercisePct);
  const offset3 = c3 - c3 * Math.min(1, stepPct);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Anneaux d'Activité</Text>
        <Text style={styles.syncBadge}>Apple Health & Fit</Text>
      </View>

      <View style={styles.contentRow}>
        {/* SVG Concentric Rings */}
        <View style={styles.ringsContainer}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Background Tracks */}
              <Circle
                cx={center}
                cy={center}
                r={r1}
                stroke="rgba(250, 17, 79, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={r2}
                stroke="rgba(160, 255, 0, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={r3}
                stroke="rgba(0, 240, 255, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Progress Arcs */}
              <Circle
                cx={center}
                cy={center}
                r={r1}
                stroke={Colors.ringMove}
                strokeWidth={strokeWidth}
                strokeDasharray={`${c1} ${c1}`}
                strokeDashoffset={offset1}
                strokeLinecap="round"
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={r2}
                stroke={Colors.ringExercise}
                strokeWidth={strokeWidth}
                strokeDasharray={`${c2} ${c2}`}
                strokeDashoffset={offset2}
                strokeLinecap="round"
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={r3}
                stroke={Colors.ringStand}
                strokeWidth={strokeWidth}
                strokeDasharray={`${c3} ${c3}`}
                strokeDashoffset={offset3}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          </Svg>
        </View>

        {/* Legend / Stats Column */}
        <View style={styles.statsColumn}>
          {/* Move */}
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.ringMove }]} />
            <View style={styles.statInfo}>
              <View style={styles.statTitleRow}>
                <Flame size={13} color={Colors.ringMove} />
                <Text style={styles.statName}>Bouger</Text>
              </View>
              <Text style={styles.statNumbers}>
                <Text style={[styles.statBold, { color: Colors.ringMove }]}>
                  {dailySummary.activeCalories}
                </Text>
                /{dailySummary.calorieGoal} kcal
              </Text>
            </View>
          </View>

          {/* Exercise */}
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.ringExercise }]} />
            <View style={styles.statInfo}>
              <View style={styles.statTitleRow}>
                <Clock size={13} color={Colors.ringExercise} />
                <Text style={styles.statName}>M'entraîner</Text>
              </View>
              <Text style={styles.statNumbers}>
                <Text style={[styles.statBold, { color: Colors.ringExercise }]}>
                  {dailySummary.activeMinutes}
                </Text>
                /{dailySummary.activeMinutesGoal} min
              </Text>
            </View>
          </View>

          {/* Stand / Steps */}
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.ringStand }]} />
            <View style={styles.statInfo}>
              <View style={styles.statTitleRow}>
                <Footprints size={13} color={Colors.ringStand} />
                <Text style={styles.statName}>Pas du jour</Text>
              </View>
              <Text style={styles.statNumbers}>
                <Text style={[styles.statBold, { color: Colors.ringStand }]}>
                  {dailySummary.steps.toLocaleString('fr-FR')}
                </Text>
                /{dailySummary.stepGoal.toLocaleString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  syncBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringsContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsColumn: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  statInfo: {
    flex: 1,
  },
  statTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statNumbers: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statBold: {
    fontWeight: '800',
    fontSize: 14,
  },
});
