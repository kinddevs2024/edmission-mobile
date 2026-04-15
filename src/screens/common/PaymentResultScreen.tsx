import { useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { getProfile } from '@/services/auth'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Nav = { goBack: () => void }

export function PaymentSuccessScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation('common')
  const c = useThemeColors()

  useEffect(() => {
    void getProfile()
  }, [])

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.title, { color: c.text }]}>{t('common:paymentSuccess')}</Text>
      <Pressable style={[styles.btn, { backgroundColor: c.primary }]} onPress={() => navigation.goBack()}>
        <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:back')}</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export function PaymentCancelScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation('common')
  const c = useThemeColors()

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.title, { color: c.text }]}>{t('common:paymentCancel')}</Text>
      <Pressable style={[styles.btn, { backgroundColor: c.primary }]} onPress={() => navigation.goBack()}>
        <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:back')}</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[6], justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: space[6] },
  btn: { paddingVertical: space[3], borderRadius: 8, alignItems: 'center' },
})
