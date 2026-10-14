import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  subtitle: string;
  accentColor: string;
  progress?: number; // 0 to 1
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  accentColor,
  progress,
  onPress,
}) => {
  const content = (
    <View style={[styles.card, { borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}18` }]}>
          {icon}
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.unit, { color: accentColor }]}>{unit}</Text>
      </View>

      {progress !== undefined && (
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
      )}

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={{ flex: 1, minWidth: '45%' }}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          onPress();
        }}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
});
