import Constants from 'expo-constants'
import { Platform } from 'react-native'

type Extra = {
  googleWebClientId?: string
  googleIosClientId?: string
  googleAndroidClientId?: string
  yandexClientId?: string
}

function getExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra
}

/**
 * Google Sign-In: same IDs as the website (`VITE_*` merged via `app.config.js` into `extra`).
 */
export function getGoogleAuthConfig(): {
  webClientId?: string
  iosClientId?: string
  androidClientId?: string
} {
  const ex = getExtra()
  const web =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    ex.googleWebClientId?.trim() ||
    ''
  const ios =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    ex.googleIosClientId?.trim() ||
    web
  const android =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
    ex.googleAndroidClientId?.trim() ||
    web
  return {
    webClientId: web || undefined,
    iosClientId: ios || undefined,
    androidClientId: android || undefined,
  }
}

export function isGoogleOAuthConfigured(): boolean {
  const c = getGoogleAuthConfig()
  if (Platform.OS === 'web') return Boolean(c.webClientId)
  if (Platform.OS === 'ios') return Boolean(c.iosClientId)
  if (Platform.OS === 'android') return Boolean(c.androidClientId)
  return Boolean(c.webClientId)
}

export function getYandexClientId(): string {
  const ex = getExtra()
  return (
    process.env.EXPO_PUBLIC_YANDEX_CLIENT_ID?.trim() ||
    ex.yandexClientId?.trim() ||
    ''
  )
}

export function isYandexOAuthConfigured(): boolean {
  return getYandexClientId().length > 0
}

/** Same rule as the website: show OAuth block if either provider is configured. */
export function isOAuthSectionVisible(): boolean {
  return isGoogleOAuthConfigured() || isYandexOAuthConfigured()
}
