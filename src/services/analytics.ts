import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '@/services/api'

/** Same key as `edmission-front` `src/services/public.ts` for cross-platform visitor continuity. */
const VISITOR_ID_STORAGE_KEY = 'edmission_visitor_id'

function createVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export async function getOrCreateVisitorId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(VISITOR_ID_STORAGE_KEY)
    if (existing) return existing
    const next = createVisitorId()
    await AsyncStorage.setItem(VISITOR_ID_STORAGE_KEY, next)
    return next
  } catch {
    return createVisitorId()
  }
}

/**
 * Records a screen view in the same collection as web `SiteVisitTracker` (`POST /public/analytics/visit`).
 * Uses Bearer token when logged in so the backend can attach `userId` / `role`.
 */
export async function trackAppScreen(path: string): Promise<void> {
  const safe = String(path ?? '').trim() || '/m'
  const normalized = safe.startsWith('/') ? safe.slice(0, 300) : `/${safe.slice(0, 299)}`
  const visitorId = await getOrCreateVisitorId()
  await api.post('/public/analytics/visit', {
    visitorId,
    path: normalized,
  })
}
