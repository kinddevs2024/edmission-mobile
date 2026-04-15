import Constants from 'expo-constants'
import { Platform } from 'react-native'

type Extra = {
  googleWebClientId?: string
  googleExpoClientId?: string
  googleIosClientId?: string
  googleAndroidClientId?: string
  yandexClientId?: string
  webAppUrl?: string
}

function getExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra
}

/**
 * Google Sign-In: same IDs as the website (`VITE_*` merged via `app.config.js` into `extra`).
 */
export function getGoogleAuthConfig(): {
  webClientId?: string
  expoClientId?: string
  iosClientId?: string
  androidClientId?: string
} {
  const ex = getExtra()
  const appOwnership = Constants.appOwnership
  const isExpoGo = appOwnership === 'expo'
  const web =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    ex.googleWebClientId?.trim() ||
    ''
  const expo =
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() ||
    ex.googleExpoClientId?.trim() ||
    web
  const ios =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    ex.googleIosClientId?.trim() ||
    web
  const android =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
    ex.googleAndroidClientId?.trim() ||
    web

  // In Expo Go, Google OAuth must use Expo proxy client id.
  // Passing Android/iOS client ids in Expo Go often causes Error 400 invalid_request.
  if (isExpoGo) {
    const expoId = expo || web || undefined
    return {
      webClientId: web || undefined,
      expoClientId: expoId,
      // expo-auth-session/providers/google still validates platform-specific ids on native.
      // In Expo Go we map them to expoClientId to avoid runtime invariant errors.
      iosClientId: expoId,
      androidClientId: expoId,
    }
  }

  return {
    webClientId: web || undefined,
    expoClientId: expo || undefined,
    iosClientId: ios || undefined,
    androidClientId: android || undefined,
  }
}

export function isGoogleOAuthConfigured(): boolean {
  const c = getGoogleAuthConfig()
  const webAppUrl = getWebAppUrl()
  const os = Platform.OS
  if (os !== 'web') {
    // Native app now supports Google OAuth via web auth page + deep link callback.
    return Boolean(webAppUrl || c.expoClientId || c.webClientId || c.iosClientId || c.androidClientId)
  }
  const isExpoGo = Constants.appOwnership === 'expo'
  if (isExpoGo) return Boolean(c.expoClientId || c.webClientId)
  if (os === 'web') return Boolean(c.webClientId)
  if (os === 'ios') return Boolean(c.iosClientId)
  if (os === 'android') return Boolean(c.androidClientId)
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

export function getWebAppUrl(): string {
  const ex = getExtra()
  return (
    process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() ||
    ex.webAppUrl?.trim() ||
    ''
  ).replace(/\/+$/, '')
}

/** Same rule as the website: show OAuth block if either provider is configured. */
export function isOAuthSectionVisible(): boolean {
  return isGoogleOAuthConfigured() || isYandexOAuthConfigured()
}
