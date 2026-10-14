import * as SQLite from 'expo-sqlite';
import { Workout, HealthMetric, SyncQueueItem, SyncLog } from '../types';

const DB_NAME = 'pulsetrack_v1.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      durationMinutes INTEGER NOT NULL,
      caloriesBurned INTEGER NOT NULL,
      avgHeartRate INTEGER NOT NULL,
      maxHeartRate INTEGER NOT NULL,
      distanceKm REAL,
      pace TEXT,
      timestamp TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY NOT NULL,
      metricType TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      recordsCount INTEGER NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      weightKg REAL NOT NULL,
      targetWeightKg REAL NOT NULL,
      heightCm REAL NOT NULL,
      bloodType TEXT NOT NULL,
      goal TEXT NOT NULL,
      targetPhysique TEXT NOT NULL,
      fitnessLevel TEXT NOT NULL,
      isOnboarded INTEGER NOT NULL DEFAULT 0,
      restingHeartRateBaseline INTEGER NOT NULL,
      vo2Max REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      dateKey TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      category TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 10
    );
  `);

  // Clean any legacy mock entries to ensure only real user data from BD is present
  await cleanMockData();
}

export async function cleanMockData(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM workouts WHERE id IN ('w-1', 'w-2', 'w-3', 'w-4', 'w-5') OR id LIKE 'remote-%';");
    await db.runAsync("DELETE FROM health_metrics WHERE id IN ('m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6') OR id LIKE 'remote-%';");
    await db.runAsync("DELETE FROM sync_logs WHERE id = 'log-init' OR id LIKE 'remote-%';");
  } catch (err) {
    console.error('Error cleaning mock data:', err);
  }
}

// ----------------- REAL DB AGGREGATIONS -----------------

export async function getTodayWorkoutStats(): Promise<{ activeCalories: number; activeMinutes: number }> {
  const db = await getDatabase();
  const todayStr = new Date().toISOString().slice(0, 10);
  const row = await db.getFirstAsync<{ totalCalories: number | null; totalMinutes: number | null }>(
    `SELECT SUM(caloriesBurned) as totalCalories, SUM(durationMinutes) as totalMinutes 
     FROM workouts 
     WHERE substr(timestamp, 1, 10) = ?;`,
    todayStr
  );
  return {
    activeCalories: row?.totalCalories ?? 0,
    activeMinutes: row?.totalMinutes ?? 0,
  };
}

export async function getTodaySteps(): Promise<number> {
  const db = await getDatabase();
  const todayStr = new Date().toISOString().slice(0, 10);
  const row = await db.getFirstAsync<{ totalSteps: number | null }>(
    `SELECT SUM(value) as totalSteps 
     FROM health_metrics 
     WHERE metricType = 'steps' AND substr(timestamp, 1, 10) = ?;`,
    todayStr
  );
  return row?.totalSteps ?? 0;
}

export async function getLatestVitals(): Promise<{
  currentHeartRate: number;
  restingHeartRate: number;
  spo2: number;
  hrv: number;
  sleepHours: number;
}> {
  const db = await getDatabase();
  const hrRow = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM health_metrics WHERE metricType = 'heart_rate' ORDER BY timestamp DESC LIMIT 1;"
  );
  const spo2Row = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM health_metrics WHERE metricType = 'spo2' ORDER BY timestamp DESC LIMIT 1;"
  );
  const hrvRow = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM health_metrics WHERE metricType = 'hrv' ORDER BY timestamp DESC LIMIT 1;"
  );
  const sleepRow = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM health_metrics WHERE metricType = 'sleep_hours' ORDER BY timestamp DESC LIMIT 1;"
  );

  let hrVal = hrRow?.value ?? 0;
  if (!hrVal) {
    const lastWorkout = await db.getFirstAsync<{ avgHeartRate: number }>(
      "SELECT avgHeartRate FROM workouts WHERE avgHeartRate > 0 ORDER BY timestamp DESC LIMIT 1;"
    );
    if (lastWorkout?.avgHeartRate) {
      hrVal = lastWorkout.avgHeartRate;
    }
  }

  return {
    currentHeartRate: hrVal,
    restingHeartRate: hrVal,
    spo2: spo2Row?.value ?? 0,
    hrv: hrvRow?.value ?? 0,
    sleepHours: sleepRow?.value ?? 0,
  };
}

export interface WeeklyDayData {
  day: string;
  dateStr: string;
  min: number;
  avg: number;
  max: number;
  hasData: boolean;
}

export async function getWeeklyHeartRateStats(): Promise<WeeklyDayData[]> {
  const db = await getDatabase();
  const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const results: WeeklyDayData[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = DAY_LABELS[d.getDay()];

    const workoutRows = await db.getAllAsync<{ avgHeartRate: number | null; maxHeartRate: number | null }>(
      `SELECT avgHeartRate, maxHeartRate FROM workouts WHERE substr(timestamp, 1, 10) = ?;`,
      dateStr
    );

    const metricRows = await db.getAllAsync<{ value: number }>(
      `SELECT value FROM health_metrics WHERE metricType = 'heart_rate' AND substr(timestamp, 1, 10) = ?;`,
      dateStr
    );

    const values: number[] = [];
    workoutRows.forEach((w) => {
      if (w.avgHeartRate) values.push(w.avgHeartRate);
      if (w.maxHeartRate) values.push(w.maxHeartRate);
    });
    metricRows.forEach((m) => {
      if (m.value) values.push(m.value);
    });

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      results.push({ day: dayLabel, dateStr, min, avg, max, hasData: true });
    } else {
      results.push({ day: dayLabel, dateStr, min: 0, avg: 0, max: 0, hasData: false });
    }
  }

  return results;
}

export async function getWeeklyAggregates(): Promise<{
  weeklyCalories: number;
  weeklySteps: number;
  maxHeartRateWeek: number;
  avgHeartRateWeek: number;
}> {
  const db = await getDatabase();
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const calRow = await db.getFirstAsync<{ totalCalories: number | null }>(
    `SELECT SUM(caloriesBurned) as totalCalories FROM workouts WHERE substr(timestamp, 1, 10) >= ?;`,
    sevenDaysAgoStr
  );

  const stepsRow = await db.getFirstAsync<{ totalSteps: number | null }>(
    `SELECT SUM(value) as totalSteps FROM health_metrics WHERE metricType = 'steps' AND substr(timestamp, 1, 10) >= ?;`,
    sevenDaysAgoStr
  );

  const hrWorkouts = await db.getAllAsync<{ avgHeartRate: number | null; maxHeartRate: number | null }>(
    `SELECT avgHeartRate, maxHeartRate FROM workouts WHERE substr(timestamp, 1, 10) >= ?;`,
    sevenDaysAgoStr
  );

  const hrMetrics = await db.getAllAsync<{ value: number }>(
    `SELECT value FROM health_metrics WHERE metricType = 'heart_rate' AND substr(timestamp, 1, 10) >= ?;`,
    sevenDaysAgoStr
  );

  const hrValues: number[] = [];
  hrWorkouts.forEach((w) => {
    if (w.avgHeartRate) hrValues.push(w.avgHeartRate);
    if (w.maxHeartRate) hrValues.push(w.maxHeartRate);
  });
  hrMetrics.forEach((m) => {
    if (m.value) hrValues.push(m.value);
  });

  const maxHeartRateWeek = hrValues.length > 0 ? Math.max(...hrValues) : 0;
  const avgHeartRateWeek =
    hrValues.length > 0
      ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
      : 0;

  return {
    weeklyCalories: calRow?.totalCalories ?? 0,
    weeklySteps: stepsRow?.totalSteps ?? 0,
    maxHeartRateWeek,
    avgHeartRateWeek,
  };
}

// ----------------- CRUD WORKOUTS -----------------

export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts ORDER BY timestamp DESC;'
  );
  return rows;
}

export async function insertWorkout(workout: Workout): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO workouts (id, type, title, durationMinutes, caloriesBurned, avgHeartRate, maxHeartRate, distanceKm, pace, timestamp, synced, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    workout.id,
    workout.type,
    workout.title,
    workout.durationMinutes,
    workout.caloriesBurned,
    workout.avgHeartRate ?? 138,
    workout.maxHeartRate ?? 162,
    workout.distanceKm ?? null,
    workout.pace ?? null,
    workout.timestamp,
    workout.synced,
    workout.source
  );

  // If created locally while offline or unsynced, queue for sync
  if (workout.synced === 0) {
    await enqueueSyncItem({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType: 'workout',
      entityId: workout.id,
      action: 'create',
      payload: JSON.stringify(workout),
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workouts WHERE id = ?;', id);
  await enqueueSyncItem({
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityType: 'workout',
    entityId: id,
    action: 'delete',
    payload: JSON.stringify({ id }),
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

// ----------------- METRICS -----------------

export async function getLatestMetric(metricType: string): Promise<HealthMetric | null> {
  const db = await getDatabase();
  const metric = await db.getFirstAsync<HealthMetric>(
    'SELECT * FROM health_metrics WHERE metricType = ? ORDER BY timestamp DESC LIMIT 1;',
    metricType
  );
  return metric ?? null;
}

export async function insertHealthMetric(metric: HealthMetric): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO health_metrics (id, metricType, value, unit, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?);`,
    metric.id,
    metric.metricType,
    metric.value,
    metric.unit,
    metric.timestamp,
    metric.synced
  );
}

// ----------------- SYNC QUEUE -----------------

export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (id, entityType, entityId, action, payload, createdAt, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    item.id,
    item.entityType,
    item.entityId,
    item.action,
    item.payload,
    item.createdAt,
    item.attempts
  );
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<SyncQueueItem>('SELECT * FROM sync_queue ORDER BY createdAt ASC;');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?;', id);
}

export async function markWorkoutAsSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workouts SET synced = 1 WHERE id = ?;', id);
}

export async function getUnsyncedCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE synced = 0;'
  );
  return row?.count ?? 0;
}

// ----------------- SYNC LOGS -----------------

export async function addSyncLog(log: SyncLog): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_logs (id, provider, status, recordsCount, message, timestamp)
     VALUES (?, ?, ?, ?, ?, ?);`,
    log.id,
    log.provider,
    log.status,
    log.recordsCount,
    log.message,
    log.timestamp
  );
}

export async function getRecentSyncLogs(limit: number = 5): Promise<SyncLog[]> {
  const db = await getDatabase();
  return await db.getAllAsync<SyncLog>(
    'SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT ?;',
    limit
  );
}

export async function clearAllDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workouts;');
  await db.runAsync('DELETE FROM health_metrics;');
  await db.runAsync('DELETE FROM sync_queue;');
  await db.runAsync('DELETE FROM sync_logs;');
  await db.runAsync('DELETE FROM user_profile;');
  await db.runAsync('DELETE FROM daily_tasks;');
}

// ----------------- USER PROFILE -----------------

export async function saveUserProfile(profile: any): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO user_profile (id, name, age, gender, weightKg, targetWeightKg, heightCm, bloodType, goal, targetPhysique, fitnessLevel, isOnboarded, restingHeartRateBaseline, vo2Max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       age = excluded.age,
       gender = excluded.gender,
       weightKg = excluded.weightKg,
       targetWeightKg = excluded.targetWeightKg,
       heightCm = excluded.heightCm,
       bloodType = excluded.bloodType,
       goal = excluded.goal,
       targetPhysique = excluded.targetPhysique,
       fitnessLevel = excluded.fitnessLevel,
       isOnboarded = excluded.isOnboarded,
       restingHeartRateBaseline = excluded.restingHeartRateBaseline,
       vo2Max = excluded.vo2Max;`,
    'current_user',
    profile.name,
    profile.age,
    profile.gender || 'male',
    profile.weightKg,
    profile.targetWeightKg || profile.weightKg,
    profile.heightCm,
    profile.bloodType || 'O+',
    profile.goal,
    profile.targetPhysique,
    profile.fitnessLevel,
    profile.isOnboarded ? 1 : 0,
    profile.restingHeartRateBaseline || 58,
    profile.vo2Max || 52
  );
}

export async function loadUserProfile(): Promise<any | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM user_profile WHERE id = ?;',
    'current_user'
  );
  if (!row) return null;
  return {
    ...row,
    isOnboarded: row.isOnboarded === 1,
    appleHealthConnected: true,
    googleFitConnected: true,
  };
}

// ----------------- DAILY TASKS -----------------

export async function loadDailyTasks(dateKey: string): Promise<any[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM daily_tasks WHERE dateKey = ?;',
    dateKey
  );
  return rows.map((r) => ({
    ...r,
    completed: r.completed === 1,
  }));
}

export async function saveDailyTasks(dateKey: string, tasks: any[]): Promise<void> {
  const db = await getDatabase();
  for (const t of tasks) {
    await db.runAsync(
      `INSERT INTO daily_tasks (id, dateKey, title, subtitle, category, completed, points)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         completed = excluded.completed;`,
      t.id,
      dateKey,
      t.title,
      t.subtitle,
      t.category,
      t.completed ? 1 : 0,
      t.points
    );
  }
}

export async function updateTaskCompletion(id: string, completed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE daily_tasks SET completed = ? WHERE id = ?;',
    completed ? 1 : 0,
    id
  );
}

