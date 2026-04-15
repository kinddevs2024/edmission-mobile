import { useEffect } from 'react'
import Constants from 'expo-constants'
import { useAuthStore } from '@/store/authStore'

const isSimulator =
  Constants.executionEnvironment === 'bare' &&
  Constants.isDevice === false

/** Registers Expo push token with the API after the user signs in. */
export function PushRegistration() {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId || isSimulator) return
    void import('../services/pushNotifications').then(({ registerPushTokenWithBackend }) =>
      registerPushTokenWithBackend()
    )
  }, [userId])

  return null
}
