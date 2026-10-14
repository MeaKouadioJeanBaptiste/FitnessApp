export type HealthMetricType = 'heart_rate' | 'steps' | 'calories' | 'sleep_hours' | 'spo2' | 'hrv';

export interface HealthMetric {
  id: string;
  metricType: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  synced: 0 | 1;
}

export type WorkoutType = 'running' | 'cycling' | 'strength' | 'swimming' | 'hiit' | 'walking';

export interface Workout {
  id: string;
  type: WorkoutType;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate?: number; // estimated automatically
  maxHeartRate?: number; // estimated automatically
  distanceKm?: number;
  pace?: string;
  // Specific adapted fields
  intensityLevel?: 'light' | 'moderate' | 'intense' | 'extreme';
  muscleGroups?: string[];
  setsCount?: number;
  swimStyle?: string;
  elevationGain?: number;
  timestamp: string;
  synced: 0 | 1;
  source: 'manual' | 'apple_health' | 'google_fit';
}

export type FitnessGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'cardio_endurance'
  | 'toning'
  | 'shred';

export type TargetPhysique =
  | 'athletic'
  | 'muscular'
  | 'lean_toned'
  | 'fit_maintenance';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DailyTask {
  id: string;
  title: string;
  subtitle: string;
  category: 'workout' | 'nutrition' | 'recovery' | 'steps';
  completed: boolean;
  points: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weightKg: number;
  targetWeightKg: number;
  heightCm: number;
  bloodType: string;
  goal: FitnessGoal;
  targetPhysique: TargetPhysique;
  fitnessLevel: FitnessLevel;
  isOnboarded: boolean;
  restingHeartRateBaseline: number;
  vo2Max: number;
  appleHealthConnected: boolean;
  googleFitConnected: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'workout' | 'metric';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  createdAt: string;
  attempts: number;
}

export interface SyncLog {
  id: string;
  provider: 'apple_health' | 'google_fit' | 'cloud';
  status: 'success' | 'failed' | 'pending';
  recordsCount: number;
  message: string;
  timestamp: string;
}

export interface DailySummary {
  steps: number;
  stepGoal: number;
  activeCalories: number;
  calorieGoal: number;
  activeMinutes: number;
  activeMinutesGoal: number;
  currentHeartRate: number;
  restingHeartRate: number;
  sleepHours: number;
  spo2: number;
  hrv: number;
}
