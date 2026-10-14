import { create } from 'zustand';
import {
  getAllWorkouts,
  insertWorkout,
  deleteWorkout,
  getUnsyncedCount,
  initDatabase,
  clearAllDatabase,
  saveUserProfile,
  loadUserProfile,
  loadDailyTasks,
  saveDailyTasks,
  updateTaskCompletion,
  getTodayWorkoutStats,
  getTodaySteps,
  getLatestVitals,
  cleanMockData,
} from '../services/database';
import { syncEngine, SyncStatus } from '../services/syncEngine';
import { healthConnector } from '../services/healthConnectors';
import { Workout, UserProfile, DailySummary, DailyTask } from '../types';
import { generateDailyProgram } from '../services/programGenerator';

interface FitnessState {
  // Navigation / Tabs
  activeTab: 'dashboard' | 'workouts' | 'health' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'workouts' | 'health' | 'settings') => void;

  // Loading
  isReady: boolean;
  isLoading: boolean;

  // Onboarding
  isOnboardingVisible: boolean;
  setIsOnboardingVisible: (visible: boolean) => void;

  // Data
  workouts: Workout[];
  user: UserProfile;
  dailySummary: DailySummary;
  dailyTasks: DailyTask[];

  // Sync
  syncStatus: SyncStatus;
  unsyncedCount: number;

  // Live stream pulse
  liveHeartRate: number;
  pulseHistory: number[];

  // Actions
  initializeApp: () => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  createNewWorkout: (workout: Omit<Workout, 'id' | 'timestamp' | 'synced'>) => Promise<void>;
  deleteExistingWorkout: (id: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  toggleOnlineMode: (isOnline: boolean) => void;
  toggleHealthKit: () => Promise<void>;
  toggleAppleHealth: () => Promise<void>;
  toggleGoogleFit: () => Promise<void>;
  setLiveHeartRate: (bpm: number) => void;
  resetDatabase: () => Promise<void>;

  // Onboarding & Program Actions
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
  toggleDailyTask: (taskId: string) => Promise<void>;
  refreshDailyProgram: () => Promise<void>;
  refreshDailySummary: () => Promise<void>;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isReady: false,
  isLoading: false,

  isOnboardingVisible: false,
  setIsOnboardingVisible: (visible) => set({ isOnboardingVisible: visible }),

  workouts: [],
  user: {
    name: 'Jean-Baptiste M.',
    age: 28,
    gender: 'male',
    weightKg: 74,
    targetWeightKg: 72,
    heightCm: 181,
    bloodType: 'O+',
    goal: 'muscle_gain',
    targetPhysique: 'athletic',
    fitnessLevel: 'intermediate',
    isOnboarded: false, // will trigger onboarding if not completed
    restingHeartRateBaseline: 58,
    vo2Max: 54,
    appleHealthConnected: true,
    googleFitConnected: true,
  },

  dailySummary: {
    steps: 0,
    stepGoal: 10000,
    activeCalories: 0,
    calorieGoal: 650,
    activeMinutes: 0,
    activeMinutesGoal: 60,
    currentHeartRate: 0,
    restingHeartRate: 0,
    sleepHours: 0,
    spo2: 0,
    hrv: 0,
  },

  dailyTasks: [],

  syncStatus: syncEngine.getStatus(),
  unsyncedCount: 0,

  liveHeartRate: 0,
  pulseHistory: [],

  initializeApp: async () => {
    set({ isLoading: true });
    try {
      await initDatabase();
      await cleanMockData();
      const workouts = await getAllWorkouts();
      const unsyncedCount = await getUnsyncedCount();

      // Subscribe to sync engine
      syncEngine.subscribe((status) => {
        set({ syncStatus: status });
      });

      // Load persistent user profile
      const storedProfile = await loadUserProfile();
      let currentUser = get().user;
      if (storedProfile) {
        currentUser = {
          ...currentUser,
          ...storedProfile,
        };
      }

      // Check date key for today's tasks
      const todayKey = new Date().toISOString().slice(0, 10);
      let tasks = await loadDailyTasks(todayKey);
      if (!tasks || tasks.length === 0) {
        tasks = generateDailyProgram(
          currentUser.goal,
          currentUser.targetPhysique,
          currentUser.fitnessLevel
        );
        await saveDailyTasks(todayKey, tasks);
      }

      // Compute real daily statistics directly from SQLite BD
      const todayStats = await getTodayWorkoutStats();
      const todaySteps = await getTodaySteps();
      const vitals = await getLatestVitals();

      const showOnboarding = !currentUser.isOnboarded;

      set({
        workouts,
        unsyncedCount,
        user: currentUser,
        dailyTasks: tasks,
        dailySummary: {
          steps: todaySteps,
          stepGoal: currentUser.goal === 'weight_loss' ? 10000 : 8000,
          activeCalories: todayStats.activeCalories,
          calorieGoal: currentUser.goal === 'weight_loss' ? 750 : 650,
          activeMinutes: todayStats.activeMinutes,
          activeMinutesGoal: 60,
          currentHeartRate: vitals.currentHeartRate,
          restingHeartRate: vitals.restingHeartRate,
          sleepHours: vitals.sleepHours,
          spo2: vitals.spo2,
          hrv: vitals.hrv,
        },
        liveHeartRate: vitals.currentHeartRate || 0,
        pulseHistory: vitals.currentHeartRate > 0 ? [vitals.currentHeartRate] : [],
        isOnboardingVisible: showOnboarding,
        isReady: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to init app:', err);
      set({ isReady: true, isLoading: false });
    }
  },

  completeOnboarding: async (data: Partial<UserProfile>) => {
    const updatedUser: UserProfile = {
      ...get().user,
      ...data,
      isOnboarded: true,
    };

    // Calculate smart calorie goal based on weight & goal
    let dailyCalorieGoal = 650;
    if (updatedUser.goal === 'weight_loss' || updatedUser.goal === 'shred') {
      dailyCalorieGoal = 750;
    } else if (updatedUser.goal === 'muscle_gain') {
      dailyCalorieGoal = 600;
    }

    // Save profile to SQLite
    await saveUserProfile(updatedUser);

    // Generate fresh daily program tailored to new goal & target physique
    const todayKey = new Date().toISOString().slice(0, 10);
    const tasks = generateDailyProgram(
      updatedUser.goal,
      updatedUser.targetPhysique,
      updatedUser.fitnessLevel
    );
    await saveDailyTasks(todayKey, tasks);

    set({
      user: updatedUser,
      dailyTasks: tasks,
      isOnboardingVisible: false,
      dailySummary: {
        ...get().dailySummary,
        calorieGoal: dailyCalorieGoal,
        stepGoal: updatedUser.goal === 'weight_loss' ? 10000 : 8000,
      },
    });
  },

  toggleDailyTask: async (taskId: string) => {
    const currentTasks = get().dailyTasks;
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const updatedTasks = currentTasks.map((t) =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );

    await updateTaskCompletion(taskId, newCompleted);
    set({ dailyTasks: updatedTasks });
  },

  refreshDailyProgram: async () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const user = get().user;
    const tasks = generateDailyProgram(user.goal, user.targetPhysique, user.fitnessLevel);
    await saveDailyTasks(todayKey, tasks);
    set({ dailyTasks: tasks });
  },

  refreshWorkouts: async () => {
    const workouts = await getAllWorkouts();
    const unsyncedCount = await getUnsyncedCount();
    set({ workouts, unsyncedCount });
  },

  createNewWorkout: async (workoutData) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: `w-${Date.now()}`,
      timestamp: new Date().toISOString(),
      synced: get().syncStatus.isOnline ? 1 : 0,
    };

    await insertWorkout(newWorkout);
    const workouts = await getAllWorkouts();
    const unsyncedCount = await getUnsyncedCount();

    // Recompute real calories & active minutes strictly from SQLite BD
    const todayStats = await getTodayWorkoutStats();
    const current = get().dailySummary;
    set({
      workouts,
      unsyncedCount,
      dailySummary: {
        ...current,
        activeCalories: todayStats.activeCalories,
        activeMinutes: todayStats.activeMinutes,
      },
    });

    // Auto-check the workout task if available in daily program!
    const workoutTask = get().dailyTasks.find((t) => t.category === 'workout' && !t.completed);
    if (workoutTask) {
      get().toggleDailyTask(workoutTask.id);
    }

    // Auto-sync if online
    if (get().syncStatus.isOnline) {
      syncEngine.syncNow();
    }
  },

  deleteExistingWorkout: async (id: string) => {
    await deleteWorkout(id);
    const workouts = await getAllWorkouts();
    const unsyncedCount = await getUnsyncedCount();
    const todayStats = await getTodayWorkoutStats();
    const current = get().dailySummary;
    set({
      workouts,
      unsyncedCount,
      dailySummary: {
        ...current,
        activeCalories: todayStats.activeCalories,
        activeMinutes: todayStats.activeMinutes,
      },
    });
  },

  refreshDailySummary: async () => {
    const todayStats = await getTodayWorkoutStats();
    const todaySteps = await getTodaySteps();
    const vitals = await getLatestVitals();
    const current = get().dailySummary;
    set({
      dailySummary: {
        ...current,
        steps: todaySteps,
        activeCalories: todayStats.activeCalories,
        activeMinutes: todayStats.activeMinutes,
        currentHeartRate: vitals.currentHeartRate,
        restingHeartRate: vitals.restingHeartRate,
        sleepHours: vitals.sleepHours,
        spo2: vitals.spo2,
        hrv: vitals.hrv,
      },
      liveHeartRate: vitals.currentHeartRate || 0,
    });
  },

  triggerSync: async () => {
    await syncEngine.syncNow();
    const workouts = await getAllWorkouts();
    const unsyncedCount = await getUnsyncedCount();
    set({ workouts, unsyncedCount });
  },

  toggleOnlineMode: (isOnline: boolean) => {
    syncEngine.setSimulatedOnlineState(isOnline);
  },

  toggleHealthKit: async () => {
    const current = get().user.appleHealthConnected;
    if (!current) {
      await healthConnector.requestPermissions();
    }
    set({
      user: {
        ...get().user,
        appleHealthConnected: !current,
      },
    });
  },

  toggleAppleHealth: async () => {
    return get().toggleHealthKit();
  },

  toggleGoogleFit: async () => {
    const current = get().user.googleFitConnected;
    if (!current) {
      await healthConnector.requestPermissions();
    }
    set({
      user: {
        ...get().user,
        googleFitConnected: !current,
      },
    });
  },

  setLiveHeartRate: (bpm: number) => {
    const history = [...get().pulseHistory.slice(-19), bpm];
    set({
      liveHeartRate: bpm,
      pulseHistory: history,
      dailySummary: {
        ...get().dailySummary,
        currentHeartRate: bpm,
      },
    });
  },

  resetDatabase: async () => {
    await clearAllDatabase();
    await cleanMockData();
    const workouts = await getAllWorkouts();
    const unsyncedCount = await getUnsyncedCount();
    const todayStats = await getTodayWorkoutStats();
    const todaySteps = await getTodaySteps();
    const vitals = await getLatestVitals();
    set({
      workouts,
      unsyncedCount,
      dailySummary: {
        steps: todaySteps,
        stepGoal: 10000,
        activeCalories: todayStats.activeCalories,
        calorieGoal: 650,
        activeMinutes: todayStats.activeMinutes,
        activeMinutesGoal: 60,
        currentHeartRate: vitals.currentHeartRate,
        restingHeartRate: vitals.restingHeartRate,
        sleepHours: vitals.sleepHours,
        spo2: vitals.spo2,
        hrv: vitals.hrv,
      },
      liveHeartRate: 0,
      pulseHistory: [],
    });
  },
}));
