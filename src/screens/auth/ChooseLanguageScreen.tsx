import { useMemo } from 'react'
import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { StackScreenProps } from '@react-navigation/stack'
import { changeAppLanguage } from '@/i18n'
import type { SupportedLng } from '@/i18n/config'
import { supportedLngs } from '@/i18n/config'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

const labels: Record<SupportedLng, { flag: string; text: string }> = {
  en: { flag: '🇺🇸', text: 'English' },
  ru: { flag: '🇷🇺', text: 'Русский' },
  uz: { flag: '🇺🇿', text: "O'zbek" },
}
const appIconNative = require('../../../assets/icon.png')

type Props = StackScreenProps<AuthStackParamList, 'ChooseLanguage'>

export function ChooseLanguageScreen({ navigation, route }: Props) {
  const { i18n } = useTranslation(['common', 'auth'])
  const c = useThemeColors()
  const isDark = useColorScheme() === 'dark'

  const nextRoute = useMemo(() => {
    const next = route.params?.next
    return next === 'Login' || next === 'Register' || next === 'Landing' ? next : 'Landing'
  }, [route.params?.next])

  const pick = async (lng: SupportedLng) => {
    await changeAppLanguage(lng)
    await i18n.changeLanguage(lng)
    navigation.navigate(nextRoute)
  }

  return (
    <View style={[styles.wrap, { backgroundColor: c.background }]}>
      <View style={styles.brandBlock}>
        <Image source={appIconNative} style={styles.brandIcon} resizeMode="contain" />
      </View>
      <View
        style={[
          styles.selectorPanel,
          {
            backgroundColor: isDark ? '#11182b' : '#ffffff',
            borderColor: isDark ? '#22304b' : '#dbe3ef',
          },
          isDark ? styles.selectorPanelShadowDark : styles.selectorPanelShadowLight,
        ]}
      >
        <View style={styles.selectorRow}>
          {supportedLngs.map((lng) => {
            const option = labels[lng]
            return (
              <Pressable
                key={lng}
                accessibilityRole="button"
                onPress={() => void pick(lng)}
                style={({ pressed }) => [
                  styles.selectorPill,
                  styles.selectorPillIdle,
                  {
                    backgroundColor: isDark ? '#162038' : '#ffffff',
                    borderColor: isDark ? '#2b3958' : c.border,
                  },
                  pressed && styles.selectorPillPressed,
                ]}
              >
                <Text style={styles.selectorFlag}>{option.flag}</Text>
                <Text style={[styles.selectorText, { color: c.text }]}>{option.text}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[4],
    gap: space[4],
  },
  brandBlock: {
    alignItems: 'center',
  },
  brandIcon: {
    width: 78,
    height: 78,
  },
  selectorPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[4],
  },
  selectorPanelShadowLight: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  selectorPanelShadowDark: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[2],
  },
  selectorPill: {
    minWidth: 100,
    borderRadius: radii.full,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectorPillIdle: {
    borderWidth: 1,
  },
  selectorPillPressed: {
    opacity: 0.8,
  },
  selectorFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  selectorText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
})
