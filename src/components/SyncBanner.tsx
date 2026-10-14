import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';

export const SyncBanner: React.FC = () => {
  const { syncStatus, unsyncedCount, triggerSync } = useFitnessStore();

  if (syncStatus.isOnline && unsyncedCount === 0 && syncStatus.state !== 'syncing') {
    return null; // All synchronized and clean
  }

  return (
    <View
      style={[
        styles.banner,
        !syncStatus.isOnline
          ? styles.offlineBanner
          : syncStatus.state === 'syncing'
          ? styles.syncingBanner
          : styles.pendingBanner,
      ]}
    >
      <View style={styles.iconWrap}>
        {!syncStatus.isOnline ? (
          <WifiOff size={16} color={Colors.offline} />
        ) : syncStatus.state === 'syncing' ? (
          <RefreshCw size={16} color={Colors.cyan} />
        ) : (
          <CheckCircle2 size={16} color={Colors.emerald} />
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {!syncStatus.isOnline
            ? 'Architecture Offline-First Active'
            : syncStatus.state === 'syncing'
            ? 'Synchronisation des données...'
            : `${unsyncedCount} séance(s) en attente de synchronisation`}
        </Text>
        <Text style={styles.subtitle}>
          {!syncStatus.isOnline
            ? 'Les données sont écrites dans SQLite local et se synchroniseront dès le retour du réseau.'
            : syncStatus.lastMessage}
        </Text>
      </View>

      {syncStatus.isOnline && syncStatus.state !== 'syncing' && unsyncedCount > 0 && (
        <TouchableOpacity style={styles.syncBtn} onPress={() => triggerSync()} activeOpacity={0.8}>
          <Text style={styles.syncBtnText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  syncingBanner: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  pendingBanner: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: Colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});
