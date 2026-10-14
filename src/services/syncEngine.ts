import * as Network from 'expo-network';
import {
  getPendingSyncQueue,
  removeSyncQueueItem,
  markWorkoutAsSynced,
  addSyncLog,
  getAllWorkouts,
  insertWorkout,
  insertHealthMetric,
} from './database';
import { healthConnector } from './healthConnectors';
import { SyncLog, Workout, HealthMetric } from '../types';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncStatus {
  state: SyncState;
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  lastMessage: string;
}

class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private currentStatus: SyncStatus = {
    state: 'idle',
    isOnline: true,
    lastSyncTime: null,
    pendingCount: 0,
    lastMessage: 'Système prêt',
  };

  private constructor() {
    this.checkNetworkInitial();
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  private async checkNetworkInitial() {
    try {
      const netState = await Network.getNetworkStateAsync();
      this.currentStatus.isOnline = Boolean(netState.isConnected && netState.isInternetReachable !== false);
      this.notifyListeners();
    } catch {
      this.currentStatus.isOnline = true;
    }
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    for (const l of this.listeners) {
      l({ ...this.currentStatus });
    }
  }

  public setSimulatedOnlineState(isOnline: boolean) {
    this.currentStatus.isOnline = isOnline;
    if (!isOnline) {
      this.currentStatus.state = 'offline';
      this.currentStatus.lastMessage = 'Mode hors-ligne actif (Sauvegarde locale SQLite)';
    } else {
      this.currentStatus.state = 'idle';
      this.currentStatus.lastMessage = 'Connexion rétablie - Synchronisation prête';
      this.syncNow();
    }
    this.notifyListeners();
  }

  public async syncNow(): Promise<boolean> {
    if (this.isSyncing) return false;

    // Check actual connectivity
    try {
      const netState = await Network.getNetworkStateAsync();
      if (!netState.isConnected && this.currentStatus.isOnline) {
        this.currentStatus.isOnline = false;
      }
    } catch {
      // ignore
    }

    if (!this.currentStatus.isOnline) {
      this.currentStatus.state = 'offline';
      this.currentStatus.lastMessage = 'Synchronisation impossible : Hors connexion';
      this.notifyListeners();
      return false;
    }

    this.isSyncing = true;
    this.currentStatus.state = 'syncing';
    this.currentStatus.lastMessage = 'Synchronisation bidirectionnelle en cours...';
    this.notifyListeners();

    try {
      // 1. Process pending SQLite Sync Queue (Push offline changes)
      const pendingItems = await getPendingSyncQueue();
      this.currentStatus.pendingCount = pendingItems.length;

      for (const item of pendingItems) {
        if (item.entityType === 'workout' && item.action === 'create') {
          await markWorkoutAsSynced(item.entityId);
        }
        await removeSyncQueueItem(item.id);
      }

      // 2. Push unsynced workouts to Apple Health / Google Fit
      const allWorkouts = await getAllWorkouts();
      const unsynced = allWorkouts.filter((w) => w.synced === 0);
      if (unsynced.length > 0) {
        await healthConnector.pushWorkoutsToRemote(unsynced);
        for (const w of unsynced) {
          await markWorkoutAsSynced(w.id);
        }
      }

      // 3. Pull remote updates from Apple Health / Google Fit
      const remote = await healthConnector.pullRemoteMetrics();
      for (const rw of remote.workouts) {
        // avoid duplicating existing workouts
        const existing = allWorkouts.some((w) => w.title === rw.title);
        if (!existing && rw.id && rw.type && rw.title) {
          await insertWorkout(rw as Workout);
        }
      }

      for (const rm of remote.metrics) {
        if (rm.id && rm.metricType && rm.value !== undefined) {
          await insertHealthMetric(rm as HealthMetric);
        }
      }

      const totalProcessed = pendingItems.length + unsynced.length + remote.workouts.length;
      const now = new Date().toISOString();

      const log: SyncLog = {
        id: `sync-log-${Date.now()}`,
        provider: healthConnector.getStatus().platform === 'ios' ? 'apple_health' : 'google_fit',
        status: 'success',
        recordsCount: totalProcessed,
        message: `Synchronisation réussie (${totalProcessed} enregistrements traités)`,
        timestamp: now,
      };
      await addSyncLog(log);

      this.currentStatus.state = 'synced';
      this.currentStatus.lastSyncTime = now;
      this.currentStatus.pendingCount = 0;
      this.currentStatus.lastMessage = `À jour (${totalProcessed} éléments synchronisés)`;
      this.isSyncing = false;
      this.notifyListeners();
      return true;
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.currentStatus.state = 'error';
      this.currentStatus.lastMessage = `Erreur de synchronisation: ${err?.message || 'Inconnue'}`;
      this.isSyncing = false;
      this.notifyListeners();
      return false;
    }
  }

  public getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }
}

export const syncEngine = SyncEngine.getInstance();
