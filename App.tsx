import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/theme';
import { useFitnessStore } from './src/store/useFitnessStore';
import { Header } from './src/components/Header';
import { BottomNavBar } from './src/components/BottomNavBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { WorkoutsScreen } from './src/screens/WorkoutsScreen';
import { HealthReportScreen } from './src/screens/HealthReportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingModal } from './src/components/OnboardingModal';

export default function App() {
  const { isReady, initializeApp, activeTab } = useFitnessStore();

  useEffect(() => {
    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.cyan} />
        <Text style={styles.loadingTitle}>PulseTrack Mobile Health</Text>
        <Text style={styles.loadingSubtitle}>
          Initialisation du moteur SQLite local & synchronisation 60 FPS...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

      {/* Top Header */}
      <Header />

      {/* Main Screen Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'workouts' && <WorkoutsScreen />}
        {activeTab === 'health' && <HealthReportScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Athletic Navigation */}
      <BottomNavBar />

      {/* Onboarding Questionnaire Modal */}
      <OnboardingModal />
    </SafeAreaView>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 18,
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
