import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '@/types/user'
import { useAuthStore } from '@/store/authStore'

const KEY_USER = 'auth_user'
const KEY_ACCESS = 'auth_accessToken'
const KEY_REFRESH = 'auth_refreshToken'
const KEY_ACTIVITY = 'auth_lastActivityAt'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export interface StoredAuth {
  user: User
  accessToken: string
  refreshToken: string | null
  lastActivityAt: number
}

export async function saveAuth(user: User, accessToken: string, refreshToken?: string | null): Promise<void> {
  try {
    const now = Date.now()
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(user))
    await AsyncStorage.setItem(KEY_ACCESS, accessToken)
    await AsyncStorage.setItem(KEY_ACTIVITY, String(now))
    if (refreshToken != null) {
      await AsyncStorage.setItem(KEY_REFRESH, refreshToken)
    }
  } catch {
    /* ignore */
  }
}

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const userStr = await AsyncStorage.getItem(KEY_USER)
    const accessToken = await AsyncStorage.getItem(KEY_ACCESS)
    const lastActivityAt = await AsyncStorage.getItem(KEY_ACTIVITY)
    if (!userStr || !accessToken || !lastActivityAt) return null
    const user = JSON.parse(userStr) as User
    const at = Number(lastActivityAt)
    if (Number.isNaN(at)) return null
    const refreshToken = await AsyncStorage.getItem(KEY_REFRESH)
    return { user, accessToken, refreshToken, lastActivityAt: at }
  } catch {
    return null
  }
}

export function getStoredRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken
}

export function isAuthExpired(lastActivityAt: number): boolean {
  return Date.now() - lastActivityAt > THIRTY_DAYS_MS
}

export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_USER)
    await AsyncStorage.removeItem(KEY_ACCESS)
    await AsyncStorage.removeItem(KEY_REFRESH)
    await AsyncStorage.removeItem(KEY_ACTIVITY)
  } catch {
    /* ignore */
  }
}

export async function updateLastActivity(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_ACTIVITY, String(Date.now()))
  } catch {
    /* ignore */
  }
}
