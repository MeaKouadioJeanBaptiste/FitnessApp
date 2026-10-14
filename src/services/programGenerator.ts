import { DailyTask, FitnessGoal, TargetPhysique, FitnessLevel } from '../types';

export function generateDailyProgram(
  goal: FitnessGoal,
  targetPhysique: TargetPhysique,
  level: FitnessLevel
): DailyTask[] {
  // Common steps target based on goal and level
  let stepsTarget = 8000;
  if (goal === 'weight_loss' || goal === 'shred') {
    stepsTarget = level === 'advanced' ? 12000 : level === 'intermediate' ? 10000 : 8000;
  } else if (goal === 'muscle_gain') {
    stepsTarget = 7000;
  } else {
    stepsTarget = 9000;
  }

  // Base tasks
  const tasks: DailyTask[] = [];

  // Task 1: Main Workout tailored to Goal & Physique
  if (goal === 'muscle_gain' || targetPhysique === 'muscular') {
    tasks.push({
      id: 'task-workout-strength',
      title: 'Séance Hypertrophie Musculaire',
      subtitle:
        level === 'advanced'
          ? '45-60 min • Focus Pectoraux, Dos ou Jambes (4 séries de 8-12 reps)'
          : '35 min • Renforcement Full-Body avec charges progressives',
      category: 'workout',
      completed: false,
      points: 40,
    });
  } else if (goal === 'weight_loss' || goal === 'shred') {
    tasks.push({
      id: 'task-workout-burn',
      title: 'Entraînement Cardio Brûle-Graisses',
      subtitle:
        level === 'advanced'
          ? '45 min Course Fractionné ou HIIT intensif (Zone 3 & 4)'
          : '30 min Marche rapide inclinée ou Vélo en continu (Zone 2)',
      category: 'workout',
      completed: false,
      points: 40,
    });
  } else if (goal === 'cardio_endurance') {
    tasks.push({
      id: 'task-workout-endurance',
      title: 'Endurance Aérobie Longue',
      subtitle: '45-60 min Course à pied ou Cyclisme en rythme régulier',
      category: 'workout',
      completed: false,
      points: 40,
    });
  } else {
    tasks.push({
      id: 'task-workout-toning',
      title: 'Circuit Tonification & Posture',
      subtitle: '30 min Pilates, Gainage dynamique et Renforcement léger',
      category: 'workout',
      completed: false,
      points: 40,
    });
  }

  // Task 2: Daily Steps quota
  tasks.push({
    id: 'task-steps',
    title: `Atteindre ${stepsTarget.toLocaleString('fr-FR')} Pas`,
    subtitle: 'Activité non-sportive (NEAT) essentielle pour le métabolisme',
    category: 'steps',
    completed: false,
    points: 25,
  });

  // Task 3: Nutrition target based on goal
  if (goal === 'muscle_gain') {
    tasks.push({
      id: 'task-nutrition',
      title: 'Apport Protéique Ciblé (1.8g / kg)',
      subtitle: 'Alimentation hypercalorique saine pour reconstruire les fibres',
      category: 'nutrition',
      completed: false,
      points: 20,
    });
  } else if (goal === 'weight_loss' || goal === 'shred') {
    tasks.push({
      id: 'task-nutrition',
      title: 'Déficit Calorique Maîtrisé (-300 kcal)',
      subtitle: 'Privilégier les protéines maigres, légumes verts et zéro sucre raffiné',
      category: 'nutrition',
      completed: false,
      points: 20,
    });
  } else {
    tasks.push({
      id: 'task-nutrition',
      title: 'Assiette Équilibrée & Hydratation 2.5L',
      subtitle: 'Micronutriments variés et hydratation cellulaire régulière',
      category: 'nutrition',
      completed: false,
      points: 20,
    });
  }

  // Task 4: Recovery / Sleep
  tasks.push({
    id: 'task-recovery',
    title: 'Sommeil Réparateur (7h30 - 8h)',
    subtitle: 'Régénération nerveuse, pic d’hormone de croissance et VRC haute',
    category: 'recovery',
    completed: false,
    points: 15,
  });

  return tasks;
}

export function getGoalLabel(goal: FitnessGoal): string {
  switch (goal) {
    case 'weight_loss':
      return 'Perte de Poids';
    case 'muscle_gain':
      return 'Prise de Muscle';
    case 'cardio_endurance':
      return 'Endurance Cardio';
    case 'toning':
      return 'Tonification & Silhouette';
    case 'shred':
      return 'Sèche & Définition';
  }
}

export function getPhysiqueLabel(physique: TargetPhysique): string {
  switch (physique) {
    case 'athletic':
      return 'Athlétique & Découpé';
    case 'muscular':
      return 'Musclé & Puissant';
    case 'lean_toned':
      return 'Sec & Sculpté';
    case 'fit_maintenance':
      return 'Équilibré & Tonique';
  }
}
