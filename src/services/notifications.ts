import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

// Safe in-memory notification queue & listeners
let notificationListeners: ((notification: { title: string; body: string }) => void)[] = [];

export function addInAppNotificationListener(
  listener: (notification: { title: string; body: string }) => void
): () => void {
  notificationListeners.push(listener);
  return () => {
    notificationListeners = notificationListeners.filter((l) => l !== listener);
  };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return true;
}

export async function sendInstantHealthAlert(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<string> {
  // Trigger haptic feedback
  try {
    if (data?.type === 'cardio') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {}

  // Notify listeners
  for (const listener of notificationListeners) {
    listener({ title, body });
  }

  // Display native mobile alert modal
  Alert.alert(title, body, [{ text: 'Compris', style: 'default' }]);

  return `notif-${Date.now()}`;
}

export async function scheduleDailyHydrationReminder(): Promise<string> {
  return await sendInstantHealthAlert(
    '💧 Hydratation & Récupération PulseTrack',
    'Votre dernière séance était intense. Buvez 500ml d’eau pour optimiser votre récupération musculaire.',
    { type: 'hydration' }
  );
}

export async function triggerSmartAlert(
  type: 'cardio' | 'goal' | 'sleep' | 'hydration'
): Promise<string> {
  switch (type) {
    case 'cardio':
      return await sendInstantHealthAlert(
        '❤️ Alerte Cardio - Zone 4 & 5',
        'Fréquence cardiaque à 168 BPM pendant plus de 15 min. Excellente stimulation VO2 Max ! Pensez à modérer.',
        { type: 'cardio' }
      );
    case 'goal':
      return await sendInstantHealthAlert(
        '🎯 Objectif Quotidien Validé !',
        'Félicitations ! Vous avez dépassé les 10 000 pas et brûlé 580 kcal actives aujourd\'hui.',
        { type: 'goal' }
      );
    case 'sleep':
      return await sendInstantHealthAlert(
        '🌙 Rapport Récupération PulseTrack',
        'Votre score de sommeil cette nuit est de 91/100 (7h48 de sommeil profond). VRC optimale à 68ms.',
        { type: 'sleep' }
      );
    case 'hydration':
      return await sendInstantHealthAlert(
        '💧 Rappel Vitalité',
        'Vous êtes à 65% de votre quota hydrique du jour. Buvez un grand verre d\'eau pour maintenir votre endurance.',
        { type: 'hydration' }
      );
  }
}
