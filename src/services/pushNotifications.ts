import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { api } from '@/services/api'

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo'
let notificationsConfigured = false

async function getNotificationsModule() {
  const Notifications = await import('expo-notifications')

  if (!notificationsConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    notificationsConfigured = true
  }

  return Notifications
}

/**
 * Registers the device for Expo push and sends the token to the API (after login).
 * Call when `user` is present; no-op on web / Expo Go simulator quirks.
 */
export async function registerPushTokenWithBackend(): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) return
  const Notifications = await getNotificationsModule()

  const { status: existing } = await Notifications.getPermissionsAsync()
  let final = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    final = status
  }
  if (final !== 'granted') return

  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId
    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {})
    await api.post('/notifications/push-token', { token: tokenRes.data })
  } catch (e) {
    console.warn('[push] register failed', e)
  }
}
