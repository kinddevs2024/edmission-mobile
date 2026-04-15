import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useAppStatusStore } from '@/store/appStatusStore'
import { getStoredRefreshToken, saveAuth, clearAuth } from './authPersistence'
import { API_URL } from '@/config/env'
import { notifyErrorHaptic } from '@/utils/haptics'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

function isAuthEndpoint(url: string | undefined, endpoint: string): boolean {
  return (url ?? '').toLowerCase().includes(endpoint)
}

async function forceLogout(): Promise<void> {
  await clearAuth()
  useAuthStore.getState().logout()
  notifyErrorHaptic()
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const isRefreshRequest = isAuthEndpoint(originalRequest?.url, '/auth/refresh')
    const isLogoutRequest = isAuthEndpoint(originalRequest?.url, '/auth/logout')
    if (error.response?.status === 401) {
      if (!originalRequest || isRefreshRequest || isLogoutRequest || originalRequest._retry) {
        await forceLogout()
        return Promise.reject(error)
      }

      const refreshToken = getStoredRefreshToken()
      if (refreshToken) {
        originalRequest._retry = true
        try {
          const { data } = await api.post<{
            user: import('@/types/user').User
            accessToken: string
            refreshToken?: string
          }>('/auth/refresh', { refreshToken })
          const nextRt = data.refreshToken ?? refreshToken
          await saveAuth(data.user, data.accessToken, nextRt)
          useAuthStore.getState().setAuth(data.user, data.accessToken, nextRt)
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch {
          await forceLogout()
          return Promise.reject(error)
        }
      }
      await forceLogout()
      return Promise.reject(error)
    }
    if (error.response?.status === 503) {
      const data = error.response.data as { code?: string } | undefined
      if (data?.code === 'MAINTENANCE') {
        useAppStatusStore.getState().setMaintenance(true)
      }
    }
    notifyErrorHaptic()
    return Promise.reject(error)
  }
)

export function getApiError(error: unknown): { message: string; errors?: Record<string, string[]> } {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string; errors?: Record<string, string[]> }
    return {
      message: data.message ?? 'An error occurred',
      errors: data.errors,
    }
  }
  return { message: error instanceof Error ? error.message : 'Unknown error' }
}
