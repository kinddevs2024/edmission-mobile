import Constants from 'expo-constants'
import { Platform } from 'react-native'

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string }

/**
 * Same backend as the web app (`edmission-front` uses `VITE_API_URL`).
 * Set `EXPO_PUBLIC_API_URL` in `.env` or `expo.extra.apiUrl` in app.json for release builds.
 */
function devDefaultApiUrl(): string {
  return 'https://edmission.uz/api'
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  extra.apiUrl?.trim() ||
  (__DEV__ ? devDefaultApiUrl() : 'https://edmission.uz/api')
