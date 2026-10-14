import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Dumbbell, FileText, Settings2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab } = useFitnessStore();

  const tabs: {
    id: 'dashboard' | 'workouts' | 'health' | 'settings';
    label: string;
    icon: (color: string) => React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      label: 'Vitals',
      icon: (color) => <Activity size={20} color={color} />,
    },
    {
      id: 'workouts',
      label: 'Séances',
      icon: (color) => <Dumbbell size={20} color={color} />,
    },
    {
      id: 'health',
      label: 'Bilan PDF',
      icon: (color) => <FileText size={20} color={color} />,
    },
    {
      id: 'settings',
      label: 'Sync & Réglages',
      icon: (color) => <Settings2 size={20} color={color} />,
    },
  ];

  const handleTabPress = async (id: 'dashboard' | 'workouts' | 'health' | 'settings') => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(id);
  };

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? Colors.cyan : Colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              {tab.icon(color)}
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0D111C',
    paddingVertical: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrap: {
    padding: 4,
    borderRadius: BorderRadius.full,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
});
