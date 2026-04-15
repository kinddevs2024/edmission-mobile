import * as Localization from 'expo-localization'

export const supportedLngs = ['en', 'ru', 'uz'] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const defaultNS = 'common'
export const fallbackLng: SupportedLng = 'en'

export const namespaces = [
  'common',
  'auth',
  'landing',
  'cookies',
  'student',
  'university',
  'admin',
  'school',
  'documents',
  'errors',
  'chat',
] as const

export const STORAGE_KEY = 'i18nextLng'

export function devicePreferredLanguage(): SupportedLng {
  const tag = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? 'en'
  if (tag === 'ru') return 'ru'
  if (tag === 'uz') return 'uz'
  return 'en'
}
