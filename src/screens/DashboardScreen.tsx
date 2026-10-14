import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Footprints, Moon, Wind, Gauge, Plus, FileText, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { SyncBanner } from '../components/SyncBanner';
import { LivePulseCard } from '../components/LivePulseCard';
import { ActivityRings } from '../components/ActivityRings';
import { MetricCard } from '../components/MetricCard';
import { WeeklyHeartRateChart } from '../components/WeeklyHeartRateChart';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { DailyProgramWidget } from '../components/DailyProgramWidget';
import { triggerSmartAlert } from '../services/notifications';
import { generateAndShareMedicalPDF } from '../services/pdfReportGenerator';
import { getWeeklyAggregates } from '../services/database';
import { RecordSpO2Modal } from '../components/RecordSpO2Modal';
import { PPGCameraHeartRateModal } from '../components/PPGCameraHeartRateModal';

export const DashboardScreen: React.FC = () => {
  const { dailySummary, user, workouts } = useFitnessStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [spo2ModalVisible, setSpo2ModalVisible] = useState(false);
  const [ppgModalVisible, setPpgModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsExporting(true);
    try {
      const weeklyAgg = await getWeeklyAggregates();
      await generateAndShareMedicalPDF({
        user,
        workouts,
        restingHeartRate: dailySummary.restingHeartRate,
        currentHeartRate: dailySummary.currentHeartRate,
        maxHeartRateWeek: weeklyAgg.maxHeartRateWeek || dailySummary.currentHeartRate || 75,
        avgHeartRateWeek: weeklyAgg.avgHeartRateWeek || dailySummary.restingHeartRate || 65,
        spo2: dailySummary.spo2,
        hrv: dailySummary.hrv,
        weeklySteps: weeklyAgg.weeklySteps,
        weeklyCalories: weeklyAgg.weeklyCalories,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNotificationDemo = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await triggerSmartAlert('cardio');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Offline/Sync Notice */}
      <SyncBanner />

      {/* 60 FPS Live Heart Rate Card */}
      <LivePulseCard />

      {/* Apple Fitness Style Rings */}
      <ActivityRings />

      {/* Personalized Daily Program Checklist & Goals Analysis */}
      <DailyProgramWidget />

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#000000" />
          <Text style={styles.actionBtnPrimaryText}>Ajouter Séance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={handleExportPDF}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          <FileText size={16} color={Colors.cyan} />
          <Text style={styles.actionBtnSecondaryText}>
            {isExporting ? 'Export...' : 'Rapport PDF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnIconOnly}
          onPress={handleNotificationDemo}
          activeOpacity={0.8}
        >
          <Bell size={18} color={Colors.crimson} />
        </TouchableOpacity>
      </View>

      {/* Vitals Grid (2 columns) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Métriques & Vitals Quotidiens</Text>
        <Text style={styles.sectionSubtitle}>Temps réel SQLite</Text>
      </View>

      <View style={styles.gridRow}>
        <MetricCard
          title="Pas Quotidien"
          value={dailySummary.steps > 0 ? dailySummary.steps.toLocaleString('fr-FR') : '0'}
          unit="pas"
          icon={<Footprints size={16} color={Colors.ringStand} />}
          subtitle={
            dailySummary.steps > 0
              ? `Objectif : ${dailySummary.stepGoal.toLocaleString('fr-FR')}`
              : `Objectif : ${dailySummary.stepGoal.toLocaleString('fr-FR')} (En attente)`
          }
          accentColor={Colors.ringStand}
          progress={dailySummary.steps > 0 ? dailySummary.steps / dailySummary.stepGoal : 0}
        />
        <MetricCard
          title="Sommeil Profond"
          value={dailySummary.sleepHours > 0 ? dailySummary.sleepHours : '--'}
          unit={dailySummary.sleepHours > 0 ? "heures" : ""}
          icon={<Moon size={16} color={Colors.purple} />}
          subtitle={dailySummary.sleepHours > 0 ? "Score de récupération" : "Aucune mesure enregistrée"}
          accentColor={Colors.purple}
          progress={dailySummary.sleepHours > 0 ? dailySummary.sleepHours / 8 : 0}
        />
      </View>

      <View style={styles.gridRow}>
        <MetricCard
          title="Saturation SpO2"
          value={dailySummary.spo2 > 0 ? dailySummary.spo2 : '--'}
          unit={dailySummary.spo2 > 0 ? "%" : ""}
          icon={<Wind size={16} color={Colors.cyan} />}
          subtitle={dailySummary.spo2 > 0 ? "Oxygénation sanguine • Toucher" : "Toucher pour enregistrer"}
          accentColor={Colors.cyan}
          progress={dailySummary.spo2 > 0 ? dailySummary.spo2 / 100 : 0}
          onPress={() => setSpo2ModalVisible(true)}
        />
        <MetricCard
          title="Variabilité VRC"
          value={dailySummary.hrv > 0 ? dailySummary.hrv : '--'}
          unit={dailySummary.hrv > 0 ? "ms" : ""}
          icon={<Gauge size={16} color={Colors.emerald} />}
          subtitle={dailySummary.hrv > 0 ? "Indicateur repos nerveux" : "Aucune mesure enregistrée"}
          accentColor={Colors.emerald}
          progress={dailySummary.hrv > 0 ? dailySummary.hrv / 100 : 0}
        />
      </View>

      {/* 7-Day Heart Rate Interactive Chart */}
      <WeeklyHeartRateChart />

      <View style={{ height: Spacing.xxl }} />

      {/* Add Workout Modal */}
      <AddWorkoutModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      {/* Record SpO2 Modal */}
      <RecordSpO2Modal
        visible={spo2ModalVisible}
        onClose={() => setSpo2ModalVisible(false)}
        onOpenOpticalCamera={() => setPpgModalVisible(true)}
      />

      {/* Optical Camera PPG Heart Rate & SpO2 Modal */}
      <PPGCameraHeartRateModal
        visible={ppgModalVisible}
        onClose={() => setPpgModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  actionBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cyan,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  actionBtnSecondary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cyan,
  },
  actionBtnIconOnly: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: Spacing.lg,
    marginTop: 10,
  },
});
