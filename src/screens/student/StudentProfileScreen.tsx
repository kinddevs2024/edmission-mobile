import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { StudentStackParamList } from '@/navigation/types'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getStudentProfile } from '@/services/student'
import type { ThemeColors } from '@/theme/colors'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import { getImageUrl } from '@/utils/imageUrl'
import { AppCard } from '@/components/ui/AppCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

export function StudentProfileScreen(_props: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()

  const query = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
  })

  if (query.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ color: c.textMuted, marginTop: space[3] }}>{t('student:loadingProfile')}</Text>
      </View>
    )
  }

  if (query.isError || !query.data) {
    return (
      <ScreenScaffold title={t('student:navProfile')}>
        <ErrorState
          title={t('common:error')}
          message={t('common:somethingWentWrong')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
      </ScreenScaffold>
    )
  }

  const p = query.data
  const avatarUri = p.avatarUrl ? getImageUrl(p.avatarUrl) : ''
  const displayName = [p.firstName, p.lastName].filter(Boolean).join(' ') || '—'

  return (
    <ScreenScaffold title={t('student:navProfile')} bottomInset={space[2]}>
      <AppCard flat style={styles.card}>
        <View style={styles.row}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh, { backgroundColor: c.primaryMuted }]}>
              <Text style={[styles.avatarLetter, { color: c.primary }]}>{displayName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.headText}>
            <Text style={[styles.name, { color: c.text }]}>{displayName}</Text>
            {p.user?.email ? (
              <Text style={[styles.email, { color: c.textMuted }]}>{p.user.email}</Text>
            ) : null}
          </View>
        </View>
      </AppCard>

      {p.portfolioCompletionPercent != null ? (
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('student:portfolioCompletion')}: {Math.round(p.portfolioCompletionPercent)}%
        </Text>
      ) : null}

      <AppCard flat style={styles.card}>
        <Field label={t('student:country')} value={p.country} c={c} />
        <Field label={t('student:city')} value={p.city} c={c} />
        <Field label={t('student:gradeLevel')} value={p.gradeLevel} c={c} />
        <Field label={t('student:gpa')} value={p.gpa != null ? String(p.gpa) : undefined} c={c} />
        <Field label={t('student:languageLevel')} value={p.languageLevel} c={c} />
      </AppCard>

      {p.bio ? (
        <AppCard flat style={styles.card}>
          <Text style={[styles.bioLabel, { color: c.textMuted }]}>{t('student:bio')}</Text>
          <Text style={[styles.bio, { color: c.text }]}>{p.bio}</Text>
        </AppCard>
      ) : null}
    </ScreenScaffold>
  )
}

function Field({
  label,
  value,
  c,
}: {
  label: string
  value?: string
  c: ThemeColors
}) {
  if (!value) return null
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: c.text }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: space[4] },
  row: { flexDirection: 'row', gap: space[4], alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  headText: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  email: { fontSize: fontSize.sm, marginTop: space[1] },
  meta: { marginBottom: space[3], fontSize: fontSize.sm },
  field: { marginBottom: space[3] },
  fieldLabel: { fontSize: fontSize.xs, marginBottom: space[1] },
  fieldValue: { fontSize: fontSize.base },
  bioLabel: { fontSize: fontSize.xs, marginBottom: space[2] },
  bio: { fontSize: fontSize.sm, lineHeight: 20 },
})
