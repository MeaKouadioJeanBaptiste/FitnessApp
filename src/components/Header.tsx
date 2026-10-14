import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Activity, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';

export const Header: React.FC = () => {
  const { syncStatus, unsyncedCount, triggerSync } = useFitnessStore();

  const handleSyncPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    triggerSync();
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return Colors.offline;
    if (syncStatus.state === 'syncing') return Colors.cyan;
    return Colors.emerald;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Hors-ligne (SQLite)';
    if (syncStatus.state === 'syncing') return 'Synchronisation...';
    if (unsyncedCount > 0) return `${unsyncedCount} en attente`;
    return 'Synchronisé';
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.iconCircle}>
          <Activity size={22} color={Colors.cyan} />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.brandName}>PulseTrack</Text>
            <View style={styles.proBadge}>
              <Zap size={10} color="#000" fill="#000" />
              <Text style={styles.proText}>60 FPS</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>Santé & Performance Athlète</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncPill, { borderColor: getStatusColor() }]}
        onPress={handleSyncPress}
        activeOpacity={0.8}
      >
        <View style={styles.syncContent}>
          {syncStatus.state === 'syncing' ? (
            <ActivityIndicator size="small" color={Colors.cyan} style={styles.syncIcon} />
          ) : !syncStatus.isOnline ? (
            <WifiOff size={14} color={Colors.offline} style={styles.syncIcon} />
          ) : unsyncedCount > 0 ? (
            <RefreshCw size={14} color={Colors.cyan} style={styles.syncIcon} />
          ) : (
            <Wifi size={14} color={Colors.emerald} style={styles.syncIcon} />
          )}

          <Text style={[styles.syncText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emerald,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  proText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  syncPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIcon: {
    marginRight: 6,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
