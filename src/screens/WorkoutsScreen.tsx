import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  Plus,
  Flame,
  Timer,
  Heart,
  MapPin,
  Trash2,
  Bike,
  Dumbbell,
  Waves,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { WorkoutType } from '../types';
import { AddWorkoutModal } from '../components/AddWorkoutModal';

export const WorkoutsScreen: React.FC = () => {
  const { workouts, deleteExistingWorkout } = useFitnessStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const filterChips: { id: string; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'running', label: 'Course' },
    { id: 'cycling', label: 'Vélo' },
    { id: 'strength', label: 'Musculation' },
    { id: 'swimming', label: 'Natation' },
    { id: 'hiit', label: 'HIIT' },
  ];

  const filteredWorkouts = workouts.filter((w) => {
    if (selectedFilter === 'all') return true;
    return w.type === selectedFilter;
  });

  const totalCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalMinutes = workouts.reduce((sum, w) => sum + w.durationMinutes, 0);

  const getWorkoutIcon = (type: WorkoutType) => {
    switch (type) {
      case 'running':
        return <Zap size={18} color={Colors.cyan} />;
      case 'cycling':
        return <Bike size={18} color={Colors.emerald} />;
      case 'strength':
        return <Dumbbell size={18} color={Colors.amber} />;
      case 'swimming':
        return <Waves size={18} color={Colors.blue} />;
      case 'hiit':
        return <Flame size={18} color={Colors.crimson} />;
      default:
        return <Zap size={18} color={Colors.textPrimary} />;
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Supprimer la séance',
      `Voulez-vous supprimer définitivement "${title}" de la base SQLite locale ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
            deleteExistingWorkout(id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPI Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Séances Total</Text>
            <Text style={styles.summaryVal}>{workouts.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Calories Brûlées</Text>
            <Text style={[styles.summaryVal, { color: Colors.crimson }]}>
              {totalCalories.toLocaleString('fr-FR')} <Text style={styles.summaryUnit}>kcal</Text>
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Temps d'Effort</Text>
            <Text style={[styles.summaryVal, { color: Colors.cyan }]}>
              {Math.floor(totalMinutes / 60)}h{totalMinutes % 60}m
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {filterChips.map((chip) => {
            const isSelected = chip.id === selectedFilter;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedFilter(chip.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Workouts List */}
        <View style={styles.listContainer}>
          {filteredWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucune séance enregistrée</Text>
              <Text style={styles.emptySubtitle}>
                Appuyez sur le bouton "+" pour ajouter votre première séance dans SQLite.
              </Text>
            </View>
          ) : (
            filteredWorkouts.map((w) => (
              <View key={w.id} style={styles.workoutCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.typeIconBadge}>{getWorkoutIcon(w.type)}</View>
                  <View style={styles.titleArea}>
                    <Text style={styles.workoutTitle}>{w.title}</Text>
                    <Text style={styles.workoutDate}>
                      {new Date(w.timestamp).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(w.id, w.title)}
                  >
                    <Trash2 size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Timer size={13} color={Colors.textSecondary} />
                    <Text style={styles.metricText}>{w.durationMinutes} min</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Flame size={13} color={Colors.crimson} />
                    <Text style={[styles.metricText, { color: Colors.crimson, fontWeight: '700' }]}>
                      {w.caloriesBurned} kcal
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Heart size={13} color={Colors.textSecondary} />
                    <Text style={styles.metricText}>{w.avgHeartRate} bpm</Text>
                  </View>

                  {w.distanceKm ? (
                    <View style={styles.metricItem}>
                      <MapPin size={13} color={Colors.cyan} />
                      <Text style={[styles.metricText, { color: Colors.cyan }]}>
                        {w.distanceKm} km
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer Badges */}
                <View style={styles.badgesFooter}>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceText}>
                      {w.source === 'apple_health'
                        ? 'Apple Health'
                        : w.source === 'google_fit'
                        ? 'Google Fit'
                        : 'Saisie Locale'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.syncStateBadge,
                      {
                        backgroundColor:
                          w.synced === 1 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      },
                    ]}
                  >
                    {w.synced === 1 ? (
                      <CheckCircle2 size={11} color={Colors.emerald} />
                    ) : (
                      <Clock size={11} color={Colors.offline} />
                    )}
                    <Text
                      style={[
                        styles.syncStateText,
                        { color: w.synced === 1 ? Colors.emerald : Colors.offline },
                      ]}
                    >
                      {w.synced === 1 ? 'Synchronisé' : 'Offline / File d’attente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Add Workout Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={26} color="#000000" />
      </TouchableOpacity>

      <AddWorkoutModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.surfaceBorder,
    alignSelf: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  summaryUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  filtersScroll: {
    marginTop: Spacing.md,
    maxHeight: 45,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterChipSelected: {
    backgroundColor: Colors.cyan,
    borderColor: Colors.cyan,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: 12,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  workoutDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  badgesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sourceBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  syncStateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  syncStateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
