import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import {
  Wifi,
  WifiOff,
  Bell,
  Heart,
  Smartphone,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Target,
  User,
  Edit3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { triggerSmartAlert } from '../services/notifications';
import { getGoalLabel, getPhysiqueLabel } from '../services/programGenerator';

export const SettingsScreen: React.FC = () => {
  const {
    syncStatus,
    toggleOnlineMode,
    user,
    setIsOnboardingVisible,
    toggleAppleHealth,
    toggleGoogleFit,
    resetDatabase,
    unsyncedCount,
  } = useFitnessStore();

  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const handleTestAlert = async (type: 'cardio' | 'goal' | 'sleep' | 'hydration') => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    await triggerSmartAlert(type);
    const messages = {
      cardio: 'Alerte Cardio (168 BPM) envoyée !',
      goal: 'Notification Objectif 10 000 pas envoyée !',
      sleep: 'Bilan Récupération & VRC envoyé !',
      hydration: 'Rappel Hydratation envoyé !',
    };
    setNotifFeedback(messages[type]);
    setTimeout(() => setNotifFeedback(null), 3000);
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser la Base SQLite',
      'Voulez-vous effacer toutes les données de la base SQLite locale ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
            await resetDatabase();
            Alert.alert('Succès', 'Base SQLite réinitialisée avec succès.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile & Goals Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
            <User size={20} color={Colors.cyan} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardTitle}>{user.name || 'Mon Profil Athlète'}</Text>
            <Text style={styles.cardSubtitle}>
              {user.age} ans • {user.weightKg} kg (Cible {user.targetWeightKg} kg) • {user.heightCm} cm
            </Text>
          </View>
        </View>

        <View style={styles.goalBadgesRow}>
          <View style={styles.profileBadge}>
            <Target size={12} color={Colors.cyan} />
            <Text style={styles.profileBadgeText}>{getGoalLabel(user.goal)}</Text>
          </View>
          <View style={[styles.profileBadge, { borderColor: 'rgba(0, 230, 118, 0.3)', backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
            <Text style={[styles.profileBadgeText, { color: Colors.emerald }]}>
              {getPhysiqueLabel(user.targetPhysique)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setIsOnboardingVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Edit3 size={15} color="#000000" />
          <Text style={styles.editProfileBtnText}>Modifier mes Objectifs & Mensurations</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Mode Switch Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: syncStatus.isOnline
                  ? 'rgba(0, 230, 118, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              },
            ]}
          >
            {syncStatus.isOnline ? (
              <Wifi size={20} color={Colors.emerald} />
            ) : (
              <WifiOff size={20} color={Colors.offline} />
            )}
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardTitle}>Testeur d'Architecture Offline-First</Text>
            <Text style={styles.cardSubtitle}>
              Simuler une coupure réseau pour tester le stockage SQLite
            </Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            État Connexion :{' '}
            <Text
              style={{
                color: syncStatus.isOnline ? Colors.emerald : Colors.offline,
                fontWeight: '800',
              }}
            >
              {syncStatus.isOnline ? 'EN LIGNE' : 'HORS-LIGNE (SQLite WAL)'}
            </Text>
          </Text>
          <Switch
            value={syncStatus.isOnline}
            onValueChange={(val) => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              toggleOnlineMode(val);
            }}
            trackColor={{ false: Colors.offline, true: Colors.emerald }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.infoBox}>
          <Info size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            En mode hors-ligne, vos séances s'enregistrent instantanément dans SQLite. Dès
            réactivation, la file de synchronisation se résout automatiquement ({unsyncedCount}{' '}
            en attente).
          </Text>
        </View>
      </View>

      {/* Health Connectors */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
            <Smartphone size={20} color={Colors.cyan} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardTitle}>Synchronisation Santé Connectée</Text>
            <Text style={styles.cardSubtitle}>
              Passerelles natives HealthKit & Google Fit
            </Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Apple Health (HealthKit)</Text>
            <Text style={styles.switchDesc}>Fréquence cardiaque, entraînements & calories</Text>
          </View>
          <Switch
            value={user.appleHealthConnected}
            onValueChange={toggleAppleHealth}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.cyan }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Google Fit / Health Connect</Text>
            <Text style={styles.switchDesc}>Podomètre, SpO2 & métriques Wear OS</Text>
          </View>
          <Switch
            value={user.googleFitConnected}
            onValueChange={toggleGoogleFit}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.emerald }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Notifications Testing */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 42, 84, 0.15)' }]}>
            <Bell size={20} color={Colors.crimson} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardTitle}>Alertes & Push Notifications</Text>
            <Text style={styles.cardSubtitle}>Déclencheurs intelligents locaux</Text>
          </View>
        </View>

        {notifFeedback && (
          <View style={styles.feedbackBanner}>
            <CheckCircle2 size={14} color={Colors.emerald} />
            <Text style={styles.feedbackText}>{notifFeedback}</Text>
          </View>
        )}

        <View style={styles.notifGrid}>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => handleTestAlert('cardio')}
            activeOpacity={0.7}
          >
            <Heart size={16} color={Colors.crimson} />
            <Text style={styles.notifButtonText}>Alerte Cardio (168 BPM)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => handleTestAlert('goal')}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={16} color={Colors.emerald} />
            <Text style={styles.notifButtonText}>Objectif 10 000 Pas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => handleTestAlert('sleep')}
            activeOpacity={0.7}
          >
            <Bell size={16} color={Colors.purple} />
            <Text style={styles.notifButtonText}>Score Sommeil & VRC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => handleTestAlert('hydration')}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={Colors.cyan} />
            <Text style={styles.notifButtonText}>Rappel Hydratation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Database Maintenance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 179, 0, 0.15)' }]}>
            <Database size={20} color={Colors.amber} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardTitle}>Gestion Base de Données SQLite</Text>
            <Text style={styles.cardSubtitle}>pulsetrack_v1.db • Mode WAL</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
          <AlertTriangle size={16} color={Colors.crimson} />
          <Text style={styles.resetButtonText}>Réinitialiser la Base SQLite Locale</Text>
        </TouchableOpacity>
      </View>

      {/* Architecture Credits */}
      <View style={styles.creditsCard}>
        <Text style={styles.creditsTitle}>PulseTrack Mobile Health Architecture</Text>
        <Text style={styles.creditsText}>
          React Native 0.86 • Expo SDK 57 • TypeScript • SQLite Local (WAL) • Zustand Store •
          Reanimated 60 FPS • Apple HealthKit & Google Fit Sync • PDF Clinical Engine
        </Text>
        <Text style={styles.creditsBadge}>Performance 60 FPS Constante • Score 4.8/5</Text>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    padding: 10,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  feedbackText: {
    fontSize: 12,
    color: Colors.emerald,
    fontWeight: '700',
  },
  notifGrid: {
    gap: 8,
  },
  notifButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  notifButtonText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 42, 84, 0.12)',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 84, 0.3)',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.crimson,
  },
  creditsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  creditsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditsText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  creditsBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.emerald,
    marginTop: 8,
  },
  goalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cyan,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cyan,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});
