import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { fontSize, space, useThemeColors } from '@/theme'

export function UniversityChatTabScreen() {
  const { t } = useTranslation(['common', 'university'])
  const c = useThemeColors()
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.title, { color: c.text }]}>{t('common:chat')}</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        {t('university:chatMobileHint', 'University chat (socket) will match the web app in a later milestone.')}
      </Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[6] },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: space[2] },
  hint: { fontSize: fontSize.sm, lineHeight: 22 },
})
