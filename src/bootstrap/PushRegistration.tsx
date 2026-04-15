import { useEffect } from 'react'
import Constants from 'expo-constants'
import { useAuthStore } from '@/store/authStore'

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo'

/** Registers Expo push token with the API after the user signs in. */
export function PushRegistration() {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId || isExpoGo) return
    void import('../services/pushNotifications').then(({ registerPushTokenWithBackend }) =>
      registerPushTokenWithBackend()
    )
  }, [userId])

  return null
}
