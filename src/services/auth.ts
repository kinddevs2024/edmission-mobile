import { api, getApiError } from './api'
import type { User, LoginResponse } from '@/types/user'
import { useAuthStore } from '@/store/authStore'
import { useAIChatStore } from '@/store/aiChatStore'
import { saveAuth, clearAuth, getStoredRefreshToken } from './authPersistence'
import { queryClient } from '@/bootstrap/queryClient'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  role: 'student' | 'university'
  acceptTerms: boolean
  name?: string
  avatarUrl?: string
}

export type RegisterResult =
  | { needsVerification: true; email: string }
  | LoginResponse

export async function loginWithGoogle(payload: {
  idToken: string
  role?: 'student' | 'university'
  acceptTerms?: boolean
}): Promise<LoginResponse> {
  await clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/google', {
    idToken: payload.idToken,
    ...(payload.role != null ? { role: payload.role } : {}),
    ...(payload.acceptTerms !== undefined ? { acceptTerms: payload.acceptTerms } : {}),
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken ?? null)
  await saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function loginWithYandex(payload: {
  code: string
  redirectUri: string
  role?: 'student' | 'university'
  acceptTerms?: boolean
}): Promise<LoginResponse> {
  await clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/yandex', {
    code: payload.code,
    redirectUri: payload.redirectUri,
    ...(payload.role != null ? { role: payload.role } : {}),
    ...(payload.acceptTerms !== undefined ? { acceptTerms: payload.acceptTerms } : {}),
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken ?? null)
  await saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function loginWithYandexAccessToken(payload: {
  accessToken: string
  role?: 'student' | 'university'
  acceptTerms?: boolean
}): Promise<LoginResponse> {
  await clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/yandex/access-token', {
    accessToken: payload.accessToken,
    ...(payload.role != null ? { role: payload.role } : {}),
    ...(payload.acceptTerms !== undefined ? { acceptTerms: payload.acceptTerms } : {}),
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken ?? null)
  await saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  await clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken ?? null)
  await saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const body: Record<string, unknown> = {
    email: payload.email,
    password: payload.password,
    role: payload.role,
    acceptTerms: payload.acceptTerms,
  }
  if (payload.name) body.name = payload.name
  if (payload.avatarUrl) body.avatarUrl = payload.avatarUrl
  const { data } = await api.post<RegisterResult>('/auth/register', body)
  if ('needsVerification' in data && data.needsVerification) {
    return { needsVerification: true, email: data.email }
  }
  const loginData = data as LoginResponse
  useAIChatStore.getState().resetSession()
  useAuthStore.getState().setAuth(loginData.user, loginData.accessToken, loginData.refreshToken ?? null)
  await saveAuth(loginData.user, loginData.accessToken, loginData.refreshToken ?? null)
  return loginData
}

export async function verifyEmailByCode(email: string, code: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/verify-email', { email, code })
  useAIChatStore.getState().resetSession()
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken ?? null)
  await saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function resendVerificationCode(email: string): Promise<void> {
  await api.post('/auth/verify-email/resend', { email })
}

async function applyLoggedOutState(): Promise<void> {
  await clearAuth()
  queryClient.clear()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
}

export async function logout(): Promise<void> {
  const refreshToken = getStoredRefreshToken()
  try {
    await api.post('/auth/logout', { refreshToken: refreshToken ?? undefined })
  } finally {
    await applyLoggedOutState()
  }
}

export async function logoutLocally(): Promise<void> {
  await applyLoggedOutState()
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function verifyEmailByLink(token: string): Promise<void> {
  await api.get('/auth/verify-email', { params: { token } })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

export async function setPassword(newPassword: string): Promise<void> {
  await api.post('/auth/set-password', { newPassword })
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  useAuthStore.getState().setUser(data)
  const token = useAuthStore.getState().accessToken
  if (token) {
    await saveAuth(data, token, getStoredRefreshToken())
  }
  return data
}

export async function updateProfile(
  patch: Partial<
    Pick<User, 'name' | 'phone' | 'socialLinks' | 'avatar' | 'notificationPreferences' | 'onboardingTutorialSeen'>
  >
): Promise<User> {
  const { data } = await api.patch<User>('/auth/me', patch)
  useAuthStore.getState().setUser(data)
  const token = useAuthStore.getState().accessToken
  if (token) {
    await saveAuth(data, token, getStoredRefreshToken())
  }
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword })
}

export { getApiError }
