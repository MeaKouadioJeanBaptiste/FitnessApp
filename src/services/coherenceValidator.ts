import { Workout, WorkoutType, UserProfile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  hasWarning: boolean;
  warningTitle?: string;
  warningMessage?: string;
  calculatedPace?: string;
  calculatedSpeedKmh?: number;
  estimatedCalories: number;
}

export function validateWorkoutCoherence(
  type: WorkoutType,
  durationMinutes: number,
  distanceKm: number | undefined,
  enteredCalories: number,
  user: UserProfile,
  pastWorkouts: Workout[]
): ValidationResult {
  let hasWarning = false;
  let warningTitle = '';
  let warningMessage = '';

  const durationHours = durationMinutes / 60;
  const userWeight = user.weightKg || 70;

  // 1. Calculate realistic calorie burn using MET (Metabolic Equivalent of Task)
  // Calories = MET * weight(kg) * duration(hours)
  let baseMET = 7.0; // default moderate
  switch (type) {
    case 'running':
      baseMET = 9.8;
      break;
    case 'cycling':
      baseMET = 8.0;
      break;
    case 'strength':
      baseMET = 6.0;
      break;
    case 'swimming':
      baseMET = 8.5;
      break;
    case 'hiit':
      baseMET = 11.0;
      break;
    case 'walking':
      baseMET = 4.0;
      break;
  }

  const estimatedCalories = Math.round(baseMET * userWeight * durationHours);

  // 2. Distance and Speed checks
  let calculatedPace: string | undefined;
  let calculatedSpeedKmh: number | undefined;

  if (distanceKm && distanceKm > 0 && durationMinutes > 0) {
    calculatedSpeedKmh = parseFloat((distanceKm / durationHours).toFixed(1));

    // Pace in min:sec / km
    const paceDecimal = durationMinutes / distanceKm;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    calculatedPace = `${paceMin}'${paceSec < 10 ? '0' : ''}${paceSec}"/km`;

    // A. Running limits
    if (type === 'running') {
      if (calculatedSpeedKmh > 25) {
        hasWarning = true;
        warningTitle = 'Vitesse de course invraisemblable';
        warningMessage = `Une allure de ${calculatedPace} (${calculatedSpeedKmh} km/h) dépasse les records mondiaux de marathon. Vérifiez la distance ou la durée saisie.`;
      }
    }

    // B. Cycling limits
    if (type === 'cycling') {
      if (calculatedSpeedKmh > 75) {
        hasWarning = true;
        warningTitle = 'Vitesse à vélo anormale';
        warningMessage = `${calculatedSpeedKmh} km/h est supérieur à la vitesse moyenne du Tour de France. Avez-vous utilisé un vélo électrique ou un véhicule ?`;
      }
    }

    // C. Swimming limits
    if (type === 'swimming') {
      if (calculatedSpeedKmh > 8.5) {
        hasWarning = true;
        warningTitle = 'Vitesse de nage impossible';
        warningMessage = `${calculatedSpeedKmh} km/h dépasse le record du monde olympique de 100m nage libre (8.4 km/h).`;
      }
    }

    // D. Walking limits
    if (type === 'walking') {
      if (calculatedSpeedKmh > 11) {
        hasWarning = true;
        warningTitle = 'Allure de marche trop rapide';
        warningMessage = `À ${calculatedSpeedKmh} km/h, cette séance ressemble davantage à de la course à pied qu'à de la marche.`;
      }
    }
  }

  // 3. Caloric Plausibility Check
  if (enteredCalories > 0 && durationHours > 0) {
    const burnRatePerHour = enteredCalories / durationHours;
    if (burnRatePerHour > 1600) {
      hasWarning = true;
      warningTitle = 'Calories brûlées improbables';
      warningMessage = `${enteredCalories} kcal en ${durationMinutes} min représente ${Math.round(
        burnRatePerHour
      )} kcal/h, ce qui dépasse le métabolisme humain maximal (~1 400 kcal/h). Estimation suggérée : ~${estimatedCalories} kcal.`;
    }
  }

  // 4. Comparison with past workout history
  const sameTypeWorkouts = pastWorkouts.filter((w) => w.type === type);
  if (sameTypeWorkouts.length > 0 && distanceKm && distanceKm > 0) {
    const maxPastDistance = Math.max(...sameTypeWorkouts.map((w) => w.distanceKm || 0));
    if (maxPastDistance > 0 && distanceKm > maxPastDistance * 4 && distanceKm > 30) {
      hasWarning = true;
      warningTitle = 'Écart majeur par rapport à votre historique';
      warningMessage = `Votre distance maximale enregistrée était de ${maxPastDistance} km. Cette séance de ${distanceKm} km semble inhabituelle.`;
    }
  }

  return {
    isValid: true,
    hasWarning,
    warningTitle,
    warningMessage,
    calculatedPace,
    calculatedSpeedKmh,
    estimatedCalories,
  };
}
