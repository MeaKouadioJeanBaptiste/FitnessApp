import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Heart, Activity, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { PPGCameraHeartRateModal } from './PPGCameraHeartRateModal';

export const LivePulseCard: React.FC = () => {
  const { liveHeartRate, pulseHistory, setLiveHeartRate, dailySummary } = useFitnessStore();
  const [ppgModalVisible, setPpgModalVisible] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // 60 FPS heartbeat animation loop
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(420),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  // Generate SVG ECG Path from real recorded history points in BD
  const width = 280;
  const height = 65;
  const points = pulseHistory.length > 1 ? pulseHistory : [60, 60, 60, 60, 60];
  const minVal = 40;
  const maxVal = 140;

  const pathD = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1 || 1)) * width;
      const y = height - ((val - minVal) / (maxVal - minVal || 1)) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${Math.max(5, Math.min(height - 5, y)).toFixed(1)}`;
    })
    .join(' ');

  const displayBpm = liveHeartRate > 0 ? liveHeartRate : dailySummary.currentHeartRate || dailySummary.restingHeartRate;

  const getZoneLabel = (bpm: number) => {
    if (bpm <= 0) return 'En attente de mesure';
    if (bpm < 100) return 'Zone 1 • Repos & Récupération';
    if (bpm < 130) return 'Zone 2 • Endurance Fondamentale';
    if (bpm < 155) return 'Zone 3 • Seuil Aérobie';
    if (bpm < 175) return 'Zone 4 • Seuil Anaérobie';
    return 'Zone 5 • Puissance Maximale';
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.heartCircle}>
              <Heart size={20} color={Colors.crimson} fill={Colors.crimson} />
            </View>
          </Animated.View>
          <View>
            <Text style={styles.cardTitle}>Fréquence Cardiaque</Text>
            <Text style={styles.liveIndicator}>● Flux en direct (60 FPS)</Text>
          </View>
        </View>

        <View style={styles.zoneBadge}>
          <Text style={styles.zoneText}>{getZoneLabel(displayBpm)}</Text>
        </View>
      </View>

      <View style={styles.mainRateRow}>
        <View style={styles.rateValueWrap}>
          <Text style={styles.rateValue}>{displayBpm > 0 ? displayBpm : '--'}</Text>
          <Text style={styles.rateUnit}>BPM</Text>
        </View>

        <View style={styles.vitalsPillGroup}>
          <View style={styles.vitalMiniPill}>
            <Text style={styles.miniLabel}>Repos</Text>
            <Text style={styles.miniValue}>
              {dailySummary.restingHeartRate > 0 ? `${dailySummary.restingHeartRate} bpm` : '--'}
            </Text>
          </View>
          <View style={styles.vitalMiniPill}>
            <Text style={styles.miniLabel}>VRC</Text>
            <Text style={[styles.miniValue, { color: Colors.purple }]}>
              {dailySummary.hrv > 0 ? `${dailySummary.hrv} ms` : '--'}
            </Text>
          </View>
          <View style={styles.vitalMiniPill}>
            <Text style={styles.miniLabel}>SpO2</Text>
            <Text style={[styles.miniValue, { color: Colors.cyan }]}>
              {dailySummary.spo2 > 0 ? `${dailySummary.spo2}%` : '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Live ECG Waveform Chart */}
      <View style={styles.chartContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={Colors.crimson} stopOpacity="0.3" />
              <Stop offset="80%" stopColor={Colors.crimson} stopOpacity="1" />
              <Stop offset="100%" stopColor={Colors.cyan} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Path
            d={pathD}
            fill="none"
            stroke="url(#pulseGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={styles.footerRow}>
        <Activity size={14} color={Colors.textSecondary} />
        <Text style={styles.footerText}>
          {displayBpm > 0
            ? 'Rythme cardiaque mesuré • Détection PPG optique haute précision'
            : 'Aucune mesure récente • Utilisez le capteur caméra ou ajoutez une séance'}
        </Text>
      </View>

      {/* Button to Trigger Contact Finger Camera + Flash PPG */}
      <TouchableOpacity
        style={styles.measurePpgBtn}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          setPpgModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <Camera size={15} color="#000000" />
        <Text style={styles.measurePpgBtnText}>Mesurer au doigt (Caméra + Flash)</Text>
      </TouchableOpacity>

      {/* PPG Optical Camera Heart Rate Modal */}
      <PPGCameraHeartRateModal
        visible={ppgModalVisible}
        onClose={() => setPpgModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 84, 0.25)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartCircle: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 42, 84, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  liveIndicator: {
    fontSize: 11,
    color: Colors.crimson,
    fontWeight: '600',
    marginTop: 2,
  },
  zoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  zoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  mainRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  rateValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rateValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  rateUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.crimson,
  },
  vitalsPillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  vitalMiniPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  chartContainer: {
    height: 65,
    marginVertical: Spacing.sm,
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  measurePpgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cyan,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  measurePpgBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});
