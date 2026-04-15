import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { API_URL } from '@/config/env'

const extra = (Constants.expoConfig?.extra ?? {}) as { webAppUrl?: string }

/**
 * In this repo the API dev server listens on :4000 and Vite (edmission-front) on :5173.
 * Using the API origin for the embedded SPA causes 404 on routes like `/student/dashboard`.
 */
function devSpaOriginFromApiOrigin(origin: string): string {
  if (!__DEV__) return origin
  try {
    const u = new URL(origin)
    if (u.port === '4000') {
      u.port = '5173'
      return u.origin
    }
  } catch {
    /* ignore */
  }
  return origin
}

/**
 * Origin of the edmission-front SPA (no trailing slash). Used to open Konva / web-only pages in WebView.
 * - Production: often same host as API without `/api`, e.g. `https://app.example.com`.
 * - Dev: set `EXPO_PUBLIC_WEB_APP_URL` (e.g. `http://10.0.2.2:5173` from Android emulator to host Vite).
 * If unset, we derive from `API_URL` by stripping `/api`, then in __DEV__ map port **4000 → 5173** (Vite).
 * On **web** in dev, default to `http://localhost:5173` if we still cannot resolve a sensible origin.
 */
export function getWebAppOrigin(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim()
  const fromExtra = extra.webAppUrl?.trim()
  const raw = fromEnv || fromExtra
  if (raw) return raw.replace(/\/$/, '')

  const api = API_URL.replace(/\/$/, '')
  let base: string
  if (api.endsWith('/api')) {
    base = api.slice(0, -4) || api
  } else {
    base = api
  }

  base = devSpaOriginFromApiOrigin(base.replace(/\/$/, ''))

  if (__DEV__ && Platform.OS === 'web') {
    try {
      const u = new URL(base)
      if (u.port === '' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        u.port = '5173'
        return u.origin
      }
    } catch {
      /* fall through */
    }
    if (!base || base === 'https://your-production-host') {
      return 'http://localhost:5173'
    }
  }

  return base
}
