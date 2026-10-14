import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind, Camera, CheckCircle2, X, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useFitnessStore } from '../store/useFitnessStore';
import { insertHealthMetric } from '../services/database';

interface RecordSpO2ModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenOpticalCamera: () => void;
}

export const RecordSpO2Modal: React.FC<RecordSpO2ModalProps> = ({
  visible,
  onClose,
  onOpenOpticalCamera,
}) => {
  const { refreshDailySummary } = useFitnessStore();
  const [spo2Input, setSpo2Input] = useState<string>('98');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const quickPresets = [95, 96, 97, 98, 99, 100];

  const handleSaveManual = async () => {
    const val = parseInt(spo2Input, 10);
    if (isNaN(val) || val < 70 || val > 100) {
      Alert.alert(
        'Valeur Invalide',
        'Veuillez saisir un pourcentage de saturation SpO2 physiologique compris entre 70% et 100%.'
      );
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setIsSaving(true);
    try {
      await insertHealthMetric({
        id: `m-spo2-${Date.now()}`,
        metricType: 'spo2',
        value: val,
        unit: '%',
        timestamp: new Date().toISOString(),
        synced: 1,
      });

      await refreshDailySummary();
      setIsSaving(false);
      onClose();
    } catch (e) {
      setIsSaving(false);
      console.error('Error saving SpO2 metric:', e);
    }
  };

  const getInterpretation = (val: number) => {
    if (val >= 95) {
      return {
        label: 'Oxygénation Optimale',
        color: Colors.emerald,
        desc: 'Saturation normale chez un adulte sain au repos.',
      };
    } else if (val >= 90) {
      return {
        label: 'Hypoxémie Légère',
        color: Colors.amber,
        desc: 'Niveau d\'oxygène bas. Reposez-vous et respirez profondément.',
      };
    } else {
      return {
        label: 'Alerte Médicale',
        color: Colors.crimson,
        desc: 'Saturation critique nécessitant un avis médical.',
      };
    }
  };

  const currentVal = parseInt(spo2Input, 10) || 98;
  const interp = getInterpretation(currentVal);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Wind size={20} color={Colors.cyan} />
              </View>
              <View>
                <Text style={styles.title}>Enregistrer Saturation SpO2</Text>
                <Text style={styles.subtitle}>Oxymétrie de pouls • Oxygénation sanguine</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Method 1: Optical Camera + Flash PPG */}
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.badgeMethod}>
                <Text style={styles.badgeMethodText}>MÉTHODE RECOMMANDÉE</Text>
              </View>
            </View>
            <Text style={styles.methodTitle}>Mesure Optique au Doigt (Caméra + Flash)</Text>
            <Text style={styles.methodDesc}>
              Posez l'index sur la caméra arrière et la LED flash pendant 15s. L'algorithme PPG
              calcule l'absorption sanguine de la lumière et déduit la SpO2, le pouls et le VRC.
            </Text>

            <TouchableOpacity
              style={styles.opticalBtn}
              onPress={() => {
                onClose();
                onOpenOpticalCamera();
              }}
              activeOpacity={0.8}
            >
              <Camera size={16} color="#000000" />
              <Text style={styles.opticalBtnText}>Lancer le scan Caméra + Flash</Text>
            </TouchableOpacity>
          </View>

          {/* Divider with OR */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU SAISIE DIRECTE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Method 2: Manual Entry */}
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Saisir la Valeur d'un Oxymètre Externe</Text>
            <Text style={styles.manualSubtitle}>
              Relevé sur oxymètre médical, montre connectée ou capteur externe.
            </Text>

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              {quickPresets.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.presetBtn,
                    spo2Input === String(pct) && styles.presetBtnActive,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setSpo2Input(String(pct));
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      spo2Input === String(pct) && styles.presetTextActive,
                    ]}
                  >
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Number Input & Interpretation */}
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={spo2Input}
                  onChangeText={setSpo2Input}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="98"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.unitText}>%</Text>
              </View>

              <View style={styles.interpWrap}>
                <View style={styles.interpBadge}>
                  <View style={[styles.interpDot, { backgroundColor: interp.color }]} />
                  <Text style={[styles.interpLabel, { color: interp.color }]}>
                    {interp.label}
                  </Text>
                </View>
                <Text style={styles.interpDesc}>{interp.desc}</Text>
              </View>
            </View>

            {/* Save Manual Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveManual}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={16} color="#000000" />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer dans la base SQLite'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Medical Notice */}
          <View style={styles.noticeRow}>
            <Info size={14} color={Colors.textMuted} />
            <Text style={styles.noticeText}>
              PulseTrack stocke vos constantes dans votre base SQLite sécurisée conforme aux standards de santé.
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  methodHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  badgeMethod: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeMethodText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.cyan,
    letterSpacing: 0.5,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  opticalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cyan,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
  },
  opticalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  manualCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  manualTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  manualSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: 3,
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Colors.cyan,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  presetTextActive: {
    color: Colors.cyan,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: 95,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 45,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.cyan,
    marginLeft: 2,
  },
  interpWrap: {
    flex: 1,
  },
  interpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  interpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  interpLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  interpDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
  noticeText: {
    fontSize: 10,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 14,
  },
});
