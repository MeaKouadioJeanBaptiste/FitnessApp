import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Flame,
  Timer,
  MapPin,
  Dumbbell,
  Bike,
  Waves,
  Zap,
  Footprints,
  AlertTriangle,
  Sparkles,
  Layers,
  Gauge,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { WorkoutType } from '../types';
import { validateWorkoutCoherence } from '../services/coherenceValidator';

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({ visible, onClose }) => {
  const { createNewWorkout, user, workouts } = useFitnessStore();

  const [type, setType] = useState<WorkoutType>('running');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('45');
  const [calories, setCalories] = useState('');
  const [distance, setDistance] = useState('7.0');

  // Discipline specific state
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([
    'Pectoraux',
    'Triceps',
  ]);
  const [setsCount, setSetsCount] = useState('16');
  const [swimStyle, setSwimStyle] = useState('Crawl');
  const [elevation, setElevation] = useState('120');
  const [rounds, setRounds] = useState('5');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense' | 'extreme'>('intense');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const workoutTypes: { type: WorkoutType; label: string; icon: React.ReactNode }[] = [
    { type: 'running', label: 'Course', icon: <Zap size={16} color={Colors.cyan} /> },
    { type: 'cycling', label: 'Vélo', icon: <Bike size={16} color={Colors.emerald} /> },
    { type: 'strength', label: 'Musculation', icon: <Dumbbell size={16} color={Colors.amber} /> },
    { type: 'swimming', label: 'Natation', icon: <Waves size={16} color={Colors.blue} /> },
    { type: 'hiit', label: 'HIIT / Circuit', icon: <Flame size={16} color={Colors.crimson} /> },
    { type: 'walking', label: 'Marche', icon: <Footprints size={16} color={Colors.ringStand} /> },
  ];

  const muscleList = ['Pectoraux', 'Dos', 'Jambes / Quadriceps', 'Épaules', 'Bras / Biceps', 'Abdos'];
  const swimStyles = ['Crawl', 'Brasse', 'Dos crawlé', 'Papillon', 'Mixte 4 Nages'];

  // Coherence validation in real time
  const durationNum = parseInt(duration, 10) || 0;
  const distanceNum = distance ? parseFloat(distance) : undefined;
  const caloriesNum = parseInt(calories, 10) || 0;

  const validation = validateWorkoutCoherence(
    type,
    durationNum,
    distanceNum,
    caloriesNum,
    user,
    workouts
  );

  // Auto-fill suggested calories when duration/type changes if calories empty
  useEffect(() => {
    if (!calories || calories === '0' || calories === '') {
      setCalories(String(validation.estimatedCalories || 350));
    }
  }, [type, duration]);

  const toggleMuscleGroup = (m: string) => {
    if (selectedMuscleGroups.includes(m)) {
      setSelectedMuscleGroups(selectedMuscleGroups.filter((g) => g !== m));
    } else {
      setSelectedMuscleGroups([...selectedMuscleGroups, m]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setIsSubmitting(true);

    const fallbackTitle =
      title.trim() ||
      `${workoutTypes.find((w) => w.type === type)?.label || 'Séance'} ${new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    await createNewWorkout({
      type,
      title: fallbackTitle,
      durationMinutes: durationNum || 30,
      caloriesBurned: caloriesNum || validation.estimatedCalories || 300,
      distanceKm: distanceNum,
      pace: validation.calculatedPace,
      intensityLevel: intensity,
      muscleGroups: type === 'strength' ? selectedMuscleGroups : undefined,
      setsCount: type === 'strength' ? parseInt(setsCount, 10) || 12 : undefined,
      swimStyle: type === 'swimming' ? swimStyle : undefined,
      elevationGain: type === 'cycling' ? parseInt(elevation, 10) || 0 : undefined,
      source: 'manual',
    });

    setIsSubmitting(false);
    onClose();
    setTitle('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Nouvelle Séance Personnalisée</Text>
              <Text style={styles.modalSubtitle}>Formulaire adapté à la discipline choisie</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Discipline Selector */}
            <Text style={styles.sectionLabel}>Discipline Sportive</Text>
            <View style={styles.typesRow}>
              {workoutTypes.map((item) => {
                const isSelected = item.type === type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.typePill, isSelected && styles.typePillSelected]}
                    onPress={() => {
                      setType(item.type);
                      // Adjust defaults
                      if (item.type === 'swimming') setDistance('1.5');
                      else if (item.type === 'cycling') setDistance('22.0');
                      else if (item.type === 'running') setDistance('7.0');
                      else if (item.type === 'walking') setDistance('4.0');
                      else setDistance('');
                    }}
                    activeOpacity={0.7}
                  >
                    {item.icon}
                    <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <Text style={styles.sectionLabel}>Titre de la Séance</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Ex: ${type === 'running' ? 'Footing Allure Spécifique' : type === 'strength' ? 'Pectoraux & Triceps' : 'Entraînement du Jour'}`}
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* General Fields: Duration & Calories */}
            <View style={styles.inputGrid}>
              <View style={styles.inputCol}>
                <View style={styles.fieldLabelRow}>
                  <Timer size={13} color={Colors.textSecondary} />
                  <Text style={styles.fieldLabel}>Durée (minutes)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>

              <View style={styles.inputCol}>
                <View style={styles.fieldLabelRow}>
                  <Flame size={13} color={Colors.crimson} />
                  <Text style={styles.fieldLabel}>Calories (kcal)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  placeholder={String(validation.estimatedCalories)}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* ---------- ADAPTED FIELDS ACCORDING TO DISCIPLINE ---------- */}

            {/* Running & Walking: Distance + Auto Pace */}
            {(type === 'running' || type === 'walking') && (
              <View style={styles.disciplineSection}>
                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <View style={styles.fieldLabelRow}>
                      <MapPin size={13} color={Colors.cyan} />
                      <Text style={styles.fieldLabel}>Distance (km)</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="decimal-pad"
                      value={distance}
                      onChangeText={setDistance}
                      placeholder="0.0"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <View style={styles.fieldLabelRow}>
                      <Gauge size={13} color={Colors.emerald} />
                      <Text style={styles.fieldLabel}>Allure Calculée</Text>
                    </View>
                    <View style={styles.readOnlyBadge}>
                      <Text style={styles.readOnlyText}>
                        {validation.calculatedPace || '--\'--" /km'}
                      </Text>
                      {validation.calculatedSpeedKmh ? (
                        <Text style={styles.readOnlySubText}>
                          ({validation.calculatedSpeedKmh} km/h)
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Cycling: Distance + Speed + Elevation */}
            {type === 'cycling' && (
              <View style={styles.disciplineSection}>
                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <View style={styles.fieldLabelRow}>
                      <MapPin size={13} color={Colors.emerald} />
                      <Text style={styles.fieldLabel}>Distance (km)</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="decimal-pad"
                      value={distance}
                      onChangeText={setDistance}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <View style={styles.fieldLabelRow}>
                      <Layers size={13} color={Colors.amber} />
                      <Text style={styles.fieldLabel}>Dénivelé D+ (m)</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={elevation}
                      onChangeText={setElevation}
                    />
                  </View>
                </View>

                {validation.calculatedSpeedKmh ? (
                  <View style={styles.speedPill}>
                    <Text style={styles.speedPillText}>
                      Vitesse Moyenne Estimée :{' '}
                      <Text style={{ fontWeight: '800', color: Colors.emerald }}>
                        {validation.calculatedSpeedKmh} km/h
                      </Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Strength Training: Muscle Groups + Sets count + Intensity */}
            {type === 'strength' && (
              <View style={styles.disciplineSection}>
                <Text style={styles.subSectionTitle}>Groupes Musculaires Travaillés</Text>
                <View style={styles.muscleTagsWrap}>
                  {muscleList.map((m) => {
                    const isSelected = selectedMuscleGroups.includes(m);
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.muscleTag, isSelected && styles.muscleTagActive]}
                        onPress={() => toggleMuscleGroup(m)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.muscleTagText, isSelected && styles.muscleTagTextActive]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Nombre Total de Séries</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={setsCount}
                      onChangeText={setSetsCount}
                      placeholder="16"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Niveau d'Intensité RPE</Text>
                    <View style={styles.intensityRow}>
                      {(['moderate', 'intense', 'extreme'] as const).map((lvl) => (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.intensityBtn,
                            intensity === lvl && styles.intensityBtnActive,
                          ]}
                          onPress={() => setIntensity(lvl)}
                        >
                          <Text
                            style={[
                              styles.intensityText,
                              intensity === lvl && styles.intensityTextActive,
                            ]}
                          >
                            {lvl === 'moderate' ? 'Moy.' : lvl === 'intense' ? 'Fort' : 'Max'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Swimming: Style + Distance */}
            {type === 'swimming' && (
              <View style={styles.disciplineSection}>
                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Distance Nage (km)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="decimal-pad"
                      value={distance}
                      onChangeText={setDistance}
                      placeholder="1.5"
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Nage Principale</Text>
                    <View style={styles.swimStylesWrap}>
                      {swimStyles.slice(0, 3).map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.swimTag, swimStyle === st && styles.swimTagActive]}
                          onPress={() => setSwimStyle(st)}
                        >
                          <Text
                            style={[
                              styles.swimTagText,
                              swimStyle === st && styles.swimTagTextActive,
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* HIIT / Circuit */}
            {type === 'hiit' && (
              <View style={styles.disciplineSection}>
                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Nombre de Tours / Rounds</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={rounds}
                      onChangeText={setRounds}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Effort Cardio</Text>
                    <View style={styles.readOnlyBadge}>
                      <Text style={[styles.readOnlyText, { color: Colors.crimson }]}>
                        Haute Intensité (Zone 4/5)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ---------- COHERENCE & PLAUSIBILITY WARNING CARD ---------- */}
            {validation.hasWarning && (
              <View style={styles.coherenceWarningCard}>
                <View style={styles.warningTitleRow}>
                  <AlertTriangle size={18} color={Colors.amber} />
                  <Text style={styles.warningTitle}>{validation.warningTitle}</Text>
                </View>
                <Text style={styles.warningMsg}>{validation.warningMessage}</Text>
                <TouchableOpacity
                  style={styles.fixButton}
                  onPress={() => {
                    setCalories(String(validation.estimatedCalories));
                  }}
                >
                  <Sparkles size={12} color="#000000" />
                  <Text style={styles.fixButtonText}>
                    Appliquer l'estimation physiologique ({validation.estimatedCalories} kcal)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Enregistrement...' : 'Valider & Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
  },
  scrollContent: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  typePillSelected: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  typeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  typeTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.sm,
  },
  inputCol: {
    flex: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  disciplineSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  readOnlyBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cyan,
  },
  readOnlySubText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  speedPill: {
    backgroundColor: Colors.surfaceElevated,
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  speedPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  muscleTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  muscleTag: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  muscleTagActive: {
    borderColor: Colors.amber,
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
  },
  muscleTagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  muscleTagTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  intensityBtnActive: {
    borderColor: Colors.crimson,
    backgroundColor: 'rgba(255, 42, 84, 0.15)',
  },
  intensityText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  intensityTextActive: {
    color: Colors.crimson,
    fontWeight: '800',
  },
  swimStylesWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  swimTag: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  swimTagActive: {
    borderColor: Colors.blue,
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
  },
  swimTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  swimTagTextActive: {
    color: Colors.blue,
    fontWeight: '800',
  },
  coherenceWarningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginTop: Spacing.md,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.amber,
  },
  warningMsg: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.amber,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  fixButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
});
