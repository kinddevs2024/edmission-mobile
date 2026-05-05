import { useEffect, useState } from 'react'
import axios from 'axios'
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
        try {
          await getProfile()
        } catch (error) {
          // Keep cached auth on network/server startup failures. Only an auth response
          // should remove the local session; otherwise reopening offline looks logged out.
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            await clearAuth()
            useAuthStore.getState().logout()
          }
        }
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return ready
}
