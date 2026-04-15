import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/** Short error vibration (native only). */
export function notifyErrorHaptic(): void {
  if (Platform.OS === 'web') return
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
}
