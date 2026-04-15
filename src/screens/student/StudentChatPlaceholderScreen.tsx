import { StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, space, useThemeColors } from '@/theme'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

export function StudentChatPlaceholderScreen(_props: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()

  return (
    <ScreenScaffold title={t('student:navChat')} scroll={false}>
      <View style={styles.box}>
        <Text style={[styles.title, { color: c.text }]}>{t('common:chat')}</Text>
        <Text style={[styles.body, { color: c.textMuted }]}>
          Real-time chat will use socket.io-client on React Native (same events as the web app). Planned right after
          this student core pass.
        </Text>
      </View>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  box: { padding: space[4] },
  title: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: space[3] },
  body: { fontSize: fontSize.base, lineHeight: 22 },
})
