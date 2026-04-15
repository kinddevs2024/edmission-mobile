import { useEffect, useState } from 'react'
import { loadAuth, isAuthExpired, clearAuth, updateLastActivity } from '@/services/authPersistence'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/services/auth'

export function useAuthHydration(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await loadAuth()
      if (cancelled) return
      if (!stored) {
        setReady(true)
        return
      }
      if (isAuthExpired(stored.lastActivityAt)) {
        await clearAuth()
        useAuthStore.getState().logout()
      } else {
        useAuthStore.getState().setAuth(stored.user, stored.accessToken, stored.refreshToken)
        await updateLastActivity()
        getProfile().catch(() => {})
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return ready
}
