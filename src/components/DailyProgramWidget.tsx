import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  CheckCircle2,
  Circle,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  Zap,
  Target,
  Trophy,
  Edit3,
  Scale,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { DailyTask } from '../types';
import { getGoalLabel, getPhysiqueLabel } from '../services/programGenerator';

export const DailyProgramWidget: React.FC = () => {
  const { user, dailyTasks, toggleDailyTask, setIsOnboardingVisible } = useFitnessStore();

  const completedCount = dailyTasks.filter((t) => t.completed).length;
  const totalCount = dailyTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalPoints = dailyTasks.reduce((sum, t) => sum + (t.completed ? t.points : 0), 0);
  const maxPoints = dailyTasks.reduce((sum, t) => sum + t.points, 0);

  const handleToggle = async (taskId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    toggleDailyTask(taskId);
  };

  const getTaskIcon = (category: DailyTask['category']) => {
    switch (category) {
      case 'workout':
        return <Dumbbell size={16} color={Colors.cyan} />;
      case 'steps':
        return <Footprints size={16} color={Colors.amber} />;
      case 'nutrition':
        return <Flame size={16} color={Colors.emerald} />;
      case 'recovery':
        return <Moon size={16} color={Colors.purple} />;
      default:
        return <Zap size={16} color={Colors.cyan} />;
    }
  };

  const weightDiff = user.targetWeightKg ? user.weightKg - user.targetWeightKg : 0;
  const weightDiffText =
    weightDiff === 0
      ? 'Objectif atteint'
      : weightDiff > 0
      ? `-${weightDiff.toFixed(1)} kg vers cible`
      : `+${Math.abs(weightDiff).toFixed(1)} kg vers cible`;

  return (
    <View style={styles.container}>
      {/* Target & Profile Banner */}
      <View style={styles.profileGoalCard}>
        <View style={styles.goalRowTop}>
          <View style={styles.badgeGoal}>
            <Target size={14} color={Colors.cyan} />
            <Text style={styles.badgeGoalText}>
              {getGoalLabel(user.goal)} • {getPhysiqueLabel(user.targetPhysique)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setIsOnboardingVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Edit3 size={12} color={Colors.textSecondary} />
            <Text style={styles.editBtnText}>Modifier profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>POIDS ACTUEL</Text>
            <Text style={styles.statValue}>
              {user.weightKg}{' '}
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>kg</Text>
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>POIDS CIBLE</Text>
            <Text style={styles.statValue}>
              {user.targetWeightKg || user.weightKg}{' '}
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>kg</Text>
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>TAILLE / ÂGE</Text>
            <Text style={styles.statValue}>
              {user.heightCm} <Text style={{ fontSize: 10, color: Colors.textMuted }}>cm</Text> •{' '}
              {user.age} <Text style={{ fontSize: 10, color: Colors.textMuted }}>ans</Text>
            </Text>
          </View>
        </View>

        <View style={styles.targetDiffRow}>
          <Scale size={13} color={Colors.emerald} />
          <Text style={styles.targetDiffText}>{weightDiffText}</Text>
          <Text style={styles.targetDiffDot}>•</Text>
          <Text style={styles.levelBadgeText}>
            Niveau {user.fitnessLevel === 'advanced' ? 'Avancé' : user.fitnessLevel === 'intermediate' ? 'Intermédiaire' : 'Débutant'}
          </Text>
        </View>
      </View>

      {/* Program Checklist Card */}
      <View style={styles.programCard}>
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.titleRow}>
              <Sparkles size={16} color={Colors.cyan} />
              <Text style={styles.cardTitle}>Mon Programme Quotidien</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Cochez vos actions au fur et à mesure de votre journée
            </Text>
          </View>

          <View style={styles.pointsBadge}>
            <Trophy size={13} color={Colors.amber} />
            <Text style={styles.pointsText}>
              {totalPoints}/{maxPoints} pts
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Progression du jour : {completedCount}/{totalCount} validées
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent === 100 ? Colors.emerald : Colors.cyan,
                },
              ]}
            />
          </View>
        </View>

        {/* All done celebratory banner */}
        {progressPercent === 100 && (
          <View style={styles.celebrationBanner}>
            <CheckCircle2 size={16} color={Colors.emerald} />
            <Text style={styles.celebrationText}>
              Programme du jour complété à 100% ! Superbe régularité.
            </Text>
          </View>
        )}

        {/* Tasks List */}
        <View style={styles.tasksList}>
          {dailyTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
              onPress={() => handleToggle(task.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.taskIconWrapper,
                  task.completed && { backgroundColor: 'rgba(0, 230, 118, 0.15)' },
                ]}
              >
                {getTaskIcon(task.category)}
              </View>

              <View style={styles.taskTextCol}>
                <View style={styles.taskTopRow}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={styles.taskPoints}>+{task.points} pts</Text>
                </View>
                <Text
                  style={[
                    styles.taskSubtitle,
                    task.completed && styles.taskSubtitleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {task.subtitle}
                </Text>
              </View>

              <View style={styles.checkboxWrapper}>
                {task.completed ? (
                  <CheckCircle2 size={22} color={Colors.emerald} />
                ) : (
                  <Circle size={22} color={Colors.surfaceBorder} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  profileGoalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  goalRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  badgeGoalText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cyan,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  editBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  targetDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  targetDiffText: {
    fontSize: 11,
    color: Colors.emerald,
    fontWeight: '700',
  },
  targetDiffDot: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  levelBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  programCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.amber,
  },
  progressContainer: {
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cyan,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  celebrationText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald,
    flex: 1,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceElevated,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskItemCompleted: {
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  taskIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  taskTitleCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskPoints: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyan,
  },
  taskSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  taskSubtitleCompleted: {
    color: Colors.textMuted,
    opacity: 0.7,
  },
  checkboxWrapper: {
    paddingLeft: 4,
  },
});
