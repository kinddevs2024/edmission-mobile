import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme/colors'

type RouteLike = { name: string; params?: Record<string, unknown> }

export function PlaceholderScreen({ route }: { route: RouteLike }) {
  const { t } = useTranslation('common')
  const p = route.params as { title?: string; id?: string; studentId?: string } | undefined
  const title = p?.title ?? route.name.replace(/([A-Z])/g, ' $1').trim()
  const extra = [p?.id && `id: ${p.id}`, p?.studentId && `studentId: ${p.studentId}`].filter(Boolean).join(' · ')
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {extra ? <Text style={styles.meta}>{extra}</Text> : null}
      <Text style={styles.hint}>{t('app.mobilePlaceholder', 'This screen matches the web app route; full UI will be ported next.')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  hint: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
})
