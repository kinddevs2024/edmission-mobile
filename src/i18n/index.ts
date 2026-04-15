import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  supportedLngs,
  defaultNS,
  fallbackLng,
  namespaces,
  STORAGE_KEY,
  devicePreferredLanguage,
  type SupportedLng,
} from './config'
import { bundledResources } from './bundledResources'

export async function getInitialLanguage(): Promise<SupportedLng> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY)
    if (saved) {
      const code = saved.split('-')[0].toLowerCase()
      if (supportedLngs.includes(code as SupportedLng)) return code as SupportedLng
    }
  } catch {
    /* ignore */
  }
  return devicePreferredLanguage()
}

export async function persistLanguage(lng: SupportedLng): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
}

export async function initI18n(): Promise<typeof i18n> {
  const lng = await getInitialLanguage()
  await i18n.use(initReactI18next).init({
    resources: bundledResources as unknown as import('i18next').Resource,
    lng,
    fallbackLng,
    defaultNS,
    ns: [...namespaces],
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  })
  await persistLanguage(lng)
  return i18n
}

export async function changeAppLanguage(lng: SupportedLng): Promise<void> {
  await i18n.changeLanguage(lng)
  await persistLanguage(lng)
}

export default i18n
