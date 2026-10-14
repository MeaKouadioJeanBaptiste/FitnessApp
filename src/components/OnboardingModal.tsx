import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  Flame,
  Dumbbell,
  Heart,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronRight,
  User,
  Scale,
  Ruler,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { FitnessGoal, TargetPhysique, FitnessLevel } from '../types';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingVisible, completeOnboarding, user } = useFitnessStore();

  const [step, setStep] = useState<number>(1);

  // Form states
  const [name, setName] = useState<string>(user.name || '');
  const [age, setAge] = useState<string>(user.age ? String(user.age) : '28');
  const [weight, setWeight] = useState<string>(user.weightKg ? String(user.weightKg) : '74');
  const [targetWeight, setTargetWeight] = useState<string>(
    user.targetWeightKg ? String(user.targetWeightKg) : '72'
  );
  const [height, setHeight] = useState<string>(user.heightCm ? String(user.heightCm) : '181');
  const [goal, setGoal] = useState<FitnessGoal>(user.goal || 'muscle_gain');
  const [targetPhysique, setTargetPhysique] = useState<TargetPhysique>(
    user.targetPhysique || 'athletic'
  );
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    user.fitnessLevel || 'intermediate'
  );

  // Real-time BMI calculation
  const weightNum = parseFloat(weight) || 70;
  const heightNum = parseFloat(height) || 175;
  const bmi = (weightNum / Math.pow(heightNum / 100, 2)).toFixed(1);

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Sous-poids', color: Colors.cyan };
    if (val < 25) return { label: 'Poids Normal / Idéal', color: Colors.emerald };
    if (val < 30) return { label: 'Léger Surpoids', color: Colors.amber };
    return { label: 'Obésité modérée', color: Colors.crimson };
  };

  const bmiCat = getBmiCategory(parseFloat(bmi));

  const handleNext = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (step < 4) {
      setStep(step + 1);
    } else {
      // Finalize onboarding
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      await completeOnboarding({
        name: name.trim() || 'Athlète',
        age: parseInt(age, 10) || 28,
        weightKg: parseFloat(weight) || 74,
        targetWeightKg: parseFloat(targetWeight) || parseFloat(weight) || 72,
        heightCm: parseFloat(height) || 180,
        goal,
        targetPhysique,
        fitnessLevel,
      });
    }
  };

  const goalsList: { id: FitnessGoal; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'weight_loss',
      title: 'Perte de Poids & Graisses',
      subtitle: 'Déficit calorique régulier, brûlage des réserves adipeuses',
      icon: <Flame size={20} color={Colors.crimson} />,
    },
    {
      id: 'muscle_gain',
      title: 'Prise de Masse & Hypertrophie',
      subtitle: 'Développement du volume musculaire et gain de force',
      icon: <Dumbbell size={20} color={Colors.cyan} />,
    },
    {
      id: 'cardio_endurance',
      title: 'Endurance & Capacité Cardio',
      subtitle: 'Amélioration du VO2 Max, du souffle et de l’endurance aérobie',
      icon: <Heart size={20} color={Colors.emerald} />,
    },
    {
      id: 'shred',
      title: 'Sèche & Définition Abdominale',
      subtitle: 'Révéler les muscles tout en maintenant la masse maigre',
      icon: <Zap size={20} color={Colors.amber} />,
    },
    {
      id: 'toning',
      title: 'Tonification & Bien-Être Quotidien',
      subtitle: 'Silhouette galbée, énergie constante et mobilité',
      icon: <Sparkles size={20} color={Colors.purple} />,
    },
  ];

  const physiquesList: {
    id: TargetPhysique;
    title: string;
    subtitle: string;
    badge: string;
  }[] = [
    {
      id: 'athletic',
      title: 'Athlétique & Découpé',
      subtitle: 'Épaules larges, taille fine, abdominaux dessinés et explosivité',
      badge: 'Type Sprinter / Boxeur',
    },
    {
      id: 'muscular',
      title: 'Musclé & Massif',
      subtitle: 'Forte densité musculaire, bras et pectoraux développés, puissance',
      badge: 'Type Bodybuilding / Force',
    },
    {
      id: 'lean_toned',
      title: 'Sec, Fin & Sculpté',
      subtitle: 'Masse grasse très basse (8-12%), silhouette élancée et sèche',
      badge: 'Type Calisthénie / Fitness Model',
    },
    {
      id: 'fit_maintenance',
      title: 'Équilibré & Tonique',
      subtitle: 'Corps sain, endurance élevée, posture redressée sans excès',
      badge: 'Type Santé Globale',
    },
  ];

  return (
    <Modal visible={isOnboardingVisible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Progress Header */}
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>PulseTrack • Profil & Objectifs</Text>
          <View style={styles.stepsPills}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotActive,
                  s < step && styles.stepDotPassed,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Personal Info & Vitals */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Bienvenue ! Définissons vos mensurations</Text>
              <Text style={styles.stepSubtitle}>
                Ces données permettront de calibrer vos dépenses caloriques et de vérifier la
                cohérence de vos futures séances.
              </Text>

              <View style={styles.inputGroup}>
                <View style={styles.fieldLabelRow}>
                  <User size={14} color={Colors.cyan} />
                  <Text style={styles.inputLabel}>Prénom ou Pseudo</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre nom"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.twoCols}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Âge (ans)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.col}>
                  <View style={styles.fieldLabelRow}>
                    <Ruler size={14} color={Colors.cyan} />
                    <Text style={styles.inputLabel}>Taille (cm)</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.twoCols}>
                <View style={styles.col}>
                  <View style={styles.fieldLabelRow}>
                    <Scale size={14} color={Colors.crimson} />
                    <Text style={styles.inputLabel}>Poids Actuel (kg)</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.col}>
                  <View style={styles.fieldLabelRow}>
                    <Target size={14} color={Colors.emerald} />
                    <Text style={styles.inputLabel}>Poids Cible (kg)</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Live BMI Banner */}
              <View style={styles.bmiCard}>
                <View style={styles.bmiTop}>
                  <Text style={styles.bmiLabel}>Indice de Masse Corporelle (IMC)</Text>
                  <Text style={[styles.bmiCategory, { color: bmiCat.color }]}>
                    {bmiCat.label}
                  </Text>
                </View>
                <View style={styles.bmiValueRow}>
                  <Text style={styles.bmiNumber}>{bmi}</Text>
                  <Text style={styles.bmiUnit}>kg/m²</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Main Fitness Goal */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Quel est votre objectif principal ?</Text>
              <Text style={styles.stepSubtitle}>
                Chaque jour, votre programme quotidien personnalisé sera généré pour cibler cette
                priorité.
              </Text>

              <View style={styles.cardsList}>
                {goalsList.map((item) => {
                  const isSelected = goal === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.selectableCard, isSelected && styles.selectableCardActive]}
                      onPress={() => setGoal(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardIconCircle}>{item.icon}</View>
                      <View style={styles.cardContent}>
                        <Text
                          style={[styles.cardItemTitle, isSelected && { color: Colors.cyan }]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.cardItemSub}>{item.subtitle}</Text>
                      </View>
                      {isSelected && <CheckCircle2 size={20} color={Colors.cyan} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Target Physique */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Quel physique aimeriez-vous avoir ?</Text>
              <Text style={styles.stepSubtitle}>
                PulseTrack adapte le ratio cardio / renforcement et les calories cibles en
                conséquence.
              </Text>

              <View style={styles.cardsList}>
                {physiquesList.map((item) => {
                  const isSelected = targetPhysique === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.selectableCard, isSelected && styles.selectableCardActive]}
                      onPress={() => setTargetPhysique(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.physiqueTopRow}>
                          <Text
                            style={[styles.cardItemTitle, isSelected && { color: Colors.cyan }]}
                          >
                            {item.title}
                          </Text>
                          <View style={styles.physiqueBadge}>
                            <Text style={styles.physiqueBadgeText}>{item.badge}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardItemSub}>{item.subtitle}</Text>
                      </View>
                      {isSelected && <CheckCircle2 size={20} color={Colors.cyan} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: Level & Confirmation */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Votre niveau d'activité actuel</Text>
              <Text style={styles.stepSubtitle}>
                Pour ajuster l'intensité des défis et la validation de cohérence de vos séances.
              </Text>

              <View style={styles.levelsRow}>
                {(['beginner', 'intermediate', 'advanced'] as FitnessLevel[]).map((lvl) => {
                  const isSelected = fitnessLevel === lvl;
                  const labels = {
                    beginner: 'Débutant\n(< 1 an)',
                    intermediate: 'Intermédiaire\n(1 à 3 ans)',
                    advanced: 'Avancé\n(3+ ans régulier)',
                  };
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.levelCard, isSelected && styles.levelCardActive]}
                      onPress={() => setFitnessLevel(lvl)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.levelText, isSelected && styles.levelTextActive]}>
                        {labels[lvl]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Summary Recap Card */}
              <View style={styles.recapCard}>
                <Text style={styles.recapHeader}>Votre Profil PulseTrack Personnalisé</Text>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Athlète :</Text>
                  <Text style={styles.recapValue}>
                    {name} ({age} ans)
                  </Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Poids :</Text>
                  <Text style={styles.recapValue}>
                    {weight} kg ➔ Objectif {targetWeight} kg
                  </Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Physique Visié :</Text>
                  <Text style={[styles.recapValue, { color: Colors.cyan }]}>
                    {physiquesList.find((p) => p.id === targetPhysique)?.title}
                  </Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Programme Quotidien :</Text>
                  <Text style={[styles.recapValue, { color: Colors.emerald }]}>
                    Checklist sur-mesure activée
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <TouchableOpacity style={styles.prevButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.prevButtonText}>Retour</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, step === 1 && { flex: 1 }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Générer Mon Programme 🚀' : 'Continuer'}
            </Text>
            {step < 4 && <ChevronRight size={18} color="#000000" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepsPills: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 22,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepDotActive: {
    backgroundColor: Colors.cyan,
    width: 32,
  },
  stepDotPassed: {
    backgroundColor: Colors.emerald,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    marginTop: Spacing.lg,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  col: {
    flex: 1,
  },
  bmiCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: Spacing.sm,
  },
  bmiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bmiCategory: {
    fontSize: 12,
    fontWeight: '800',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  bmiNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  bmiUnit: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  cardsList: {
    gap: 10,
  },
  selectableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  selectableCardActive: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  cardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardItemSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  physiqueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  physiqueBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  physiqueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  levelCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minHeight: 70,
  },
  levelCardActive: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  levelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  levelTextActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  recapCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  recapHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recapLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recapValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 12,
  },
  prevButton: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.cyan,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
});
