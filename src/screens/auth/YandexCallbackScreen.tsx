import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackScreenProps } from '@react-navigation/stack'
import { colors } from '@/theme/colors'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'YandexCallback'>

export function YandexCallbackScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common'])
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('auth:yandexCallbackTitle', 'Yandex sign-in')}</Text>
      <Text style={styles.muted}>
        {t(
          'auth:yandexCallbackMobile',
          'OAuth callback is set up for the website. Use email/password here, or sign in with Yandex in the browser.'
        )}
      </Text>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>{t('common:login')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 20 },
  link: { color: colors.primary, fontSize: 16 },
})
