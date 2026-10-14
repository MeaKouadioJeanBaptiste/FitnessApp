import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getWeeklyHeartRateStats, WeeklyDayData } from '../services/database';
import { useFitnessStore } from '../store/useFitnessStore';

export const WeeklyHeartRateChart: React.FC = () => {
  const { workouts, dailySummary } = useFitnessStore();
  const [weekData, setWeekData] = useState<WeeklyDayData[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default: Today (last item)

  const loadWeekData = React.useCallback(async () => {
    try {
      const data = await getWeeklyHeartRateStats();
      setWeekData(data);
      if (data.length > 0 && selectedDayIndex >= data.length) {
        setSelectedDayIndex(data.length - 1);
      }
    } catch (e) {
      console.error('Error loading weekly heart rate from DB:', e);
    }
  }, [selectedDayIndex]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData, workouts, dailySummary.currentHeartRate]);

  const width = 310;
  const height = 110;
  const paddingX = 18;
  const paddingY = 14;

  const minVal = 40;
  const maxVal = 190;

  const hasAnyData = weekData.some((d) => d.hasData);

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (Math.max(1, weekData.length - 1))) * (width - 2 * paddingX);
    const clampedVal = Math.max(minVal, Math.min(maxVal, val));
    const y = height - paddingY - ((clampedVal - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y };
  };

  // Generate SVG path for Average line
  const avgPath = weekData
    .map((d, i) => {
      const val = d.hasData ? d.avg : minVal + 10;
      const { x, y } = getCoordinates(i, val);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Generate SVG path for Max line
  const maxPath = weekData
    .map((d, i) => {
      const val = d.hasData ? d.max : minVal + 10;
      const { x, y } = getCoordinates(i, val);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const selectedData = weekData[selectedDayIndex] || {
    day: 'Auj',
    dateStr: '',
    min: 0,
    avg: 0,
    max: 0,
    hasData: false,
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Tendance Cardiaque Hebdomadaire</Text>
          <Text style={styles.subtitle}>Données réelles issues de la base SQLite</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.cyan }]} />
            <Text style={styles.legendText}>Moyenne</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.crimson }]} />
            <Text style={styles.legendText}>Max</Text>
          </View>
        </View>
      </View>

      {/* Selected Day Floating Tag */}
      <View style={styles.highlightRow}>
        <Text style={styles.highlightDay}>{selectedData.day} :</Text>
        {selectedData.hasData ? (
          <Text style={styles.highlightStat}>
            Min <Text style={styles.highlightVal}>{selectedData.min}</Text> bpm • Moy{' '}
            <Text style={[styles.highlightVal, { color: Colors.cyan }]}>{selectedData.avg}</Text> bpm •
            Max <Text style={[styles.highlightVal, { color: Colors.crimson }]}>{selectedData.max}</Text>{' '}
            bpm
          </Text>
        ) : (
          <Text style={styles.highlightStat}>
            Aucun battement enregistré ce jour dans la base SQLite
          </Text>
        )}
      </View>

      {/* Chart or Empty state */}
      {!hasAnyData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucune séance ni mesure optique enregistrée cette semaine.
          </Text>
          <Text style={styles.emptyHint}>
            Prenez votre pouls via la caméra ou enregistrez une séance pour visualiser votre courbe.
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              <LinearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.cyan} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={Colors.cyan} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Average Stroke */}
            <Path
              d={avgPath}
              fill="none"
              stroke={Colors.cyan}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Max Effort Stroke */}
            <Path
              d={maxPath}
              fill="none"
              stroke={Colors.crimson}
              strokeWidth="2.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />

            {/* Selected marker dot */}
            {weekData.map((d, i) => {
              if (!d.hasData) return null;
              const { x: xAvg, y: yAvg } = getCoordinates(i, d.avg);
              const { x: xMax, y: yMax } = getCoordinates(i, d.max);
              const isSelected = i === selectedDayIndex;

              return (
                <React.Fragment key={d.dateStr + d.day}>
                  <Circle
                    cx={xAvg}
                    cy={yAvg}
                    r={isSelected ? 5 : 3}
                    fill={Colors.cyan}
                    stroke={Colors.surface}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <Circle
                    cx={xMax}
                    cy={yMax}
                    r={isSelected ? 4 : 2}
                    fill={Colors.crimson}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      )}

      {/* Days Selector Buttons */}
      <View style={styles.daysRow}>
        {weekData.map((d, index) => {
          const isSelected = index === selectedDayIndex;
          return (
            <TouchableOpacity
              key={d.dateStr || d.day + index}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => setSelectedDayIndex(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {d.day}
              </Text>
              {d.hasData && <View style={styles.hasDataDot} />}
            </TouchableOpacity>
          );
        })}
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
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.sm,
    gap: 6,
  },
  highlightDay: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  highlightStat: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  highlightVal: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chartWrapper: {
    height: 110,
    justifyContent: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dayButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  dayText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: Colors.cyan,
    fontWeight: '800',
  },
  hasDataDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cyan,
    marginTop: 2,
  },
});
