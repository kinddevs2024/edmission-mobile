import { useLayoutEffect, useMemo } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getInterestedUniversityIds,
  getInterestLimit,
  getUniversityDetail,
  showInterest,
} from '@/services/student'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import { getImageUrl } from '@/utils/imageUrl'
import { AppButton } from '@/components/ui/AppButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = {
  navigation: StackNavigationProp<StudentStackParamList>
  route: { params: { id: string } }
}

export function UniversityDetailScreen({ navigation, route }: Props) {
  const { id } = route.params
  const { t } = useTranslation(['student', 'common', 'university'])
  const c = useThemeColors()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['university-detail', id],
    queryFn: () => getUniversityDetail(id),
  })

  const idsQuery = useQuery({
    queryKey: ['student-interested-university-ids'],
    queryFn: getInterestedUniversityIds,
  })

  const limitQuery = useQuery({
    queryKey: ['student-interest-limit'],
    queryFn: getInterestLimit,
  })

  const interested = useMemo(
    () => (idsQuery.data ?? []).includes(id),
    [idsQuery.data, id]
  )

  const interestMutation = useMutation({
    mutationFn: () => showInterest(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-interested-university-ids'] })
      await qc.invalidateQueries({ queryKey: ['student-applications'] })
      await qc.invalidateQueries({ queryKey: ['student-universities'] })
      await qc.invalidateQueries({ queryKey: ['student-interest-limit'] })
    },
    onError: async () => {
      await qc.invalidateQueries({ queryKey: ['student-interest-limit'] })
    },
  })

  const uni = detailQuery.data
  const name = uni?.name ?? ''

  useLayoutEffect(() => {
    navigation.setOptions({ title: name || t('common:university') })
  }, [navigation, name, t])

  const logoUri = uni ? getImageUrl(uni.logoUrl ?? uni.logo) : ''
  const canInterest =
    !interested &&
    limitQuery.isSuccess &&
    limitQuery.data?.allowed === true &&
    !interestMutation.isPending

  if (detailQuery.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    )
  }

  if (detailQuery.isError || !uni) {
    return (
      <ScreenScaffold scroll={false}>
        <ErrorState
          title={t('common:error')}
          message={t('common:somethingWentWrong')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void detailQuery.refetch()}
        />
      </ScreenScaffold>
    )
  }

  return (
    <ScreenScaffold scroll bottomInset={space[2]}>
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={styles.heroLogo} resizeMode="contain" />
      ) : null}
      <Text style={[styles.sub, { color: c.textMuted }]}>
        {[uni.city, uni.country].filter(Boolean).join(', ')}
      </Text>
      {uni.description ? (
        <Text style={[styles.body, { color: c.text }]}>{uni.description}</Text>
      ) : (
        <Text style={[styles.body, { color: c.textMuted }]}>{t('student:noDescription')}</Text>
      )}

      {uni.matchScore != null ? (
        <Text style={[styles.match, { color: c.primary }]}>
          {t('student:matchScore')}: {Math.round(uni.matchScore)}%
        </Text>
      ) : null}

      {uni.programs && uni.programs.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.h2, { color: c.text }]}>{t('university:facultyProgramsLabel')}</Text>
          {uni.programs.slice(0, 12).map((p) => (
            <Text key={p.id} style={[styles.li, { color: c.textMuted }]}>
              • {p.name ?? p.degree ?? p.field ?? '—'}
            </Text>
          ))}
        </View>
      ) : null}

      {uni.scholarships && uni.scholarships.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.h2, { color: c.text }]}>{t('university:navScholarships')}</Text>
          {uni.scholarships.slice(0, 10).map((s) => (
            <Text key={s.id} style={[styles.li, { color: c.textMuted }]}>
              • {s.name ?? '—'}
              {s.coveragePercent != null ? ` · ${s.coveragePercent}%` : ''}
              {s.deadline ? ` · ${s.deadline}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {uni.faculties && uni.faculties.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.h2, { color: c.text }]}>{t('university:facultiesListTitle')}</Text>
          {uni.faculties.slice(0, 8).map((f) => (
            <Text key={f.id} style={[styles.li, { color: c.textMuted }]} numberOfLines={3}>
              • {f.name}: {f.description}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.cta}>
        {interested ? (
          <Text style={[styles.interestedNote, { color: c.textMuted }]}>
            {t('student:interestedButton')} ✓
          </Text>
        ) : limitQuery.isError ? (
          <Text style={[styles.interestedNote, { color: c.danger }]}>{t('common:somethingWentWrong')}</Text>
        ) : limitQuery.isPending ? (
          <AppButton title={t('common:loading')} disabled loading />
        ) : !limitQuery.data?.allowed ? (
          <Text style={[styles.interestedNote, { color: c.danger }]}>
            {t('student:interestLimitReached')}
          </Text>
        ) : (
          <AppButton
            title={t('student:showInterest')}
            loading={interestMutation.isPending}
            disabled={!canInterest}
            onPress={() => interestMutation.mutate()}
          />
        )}
      </View>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroLogo: { width: '100%', height: 120, marginBottom: space[3] },
  sub: { fontSize: fontSize.sm, marginBottom: space[3] },
  body: { fontSize: fontSize.base, lineHeight: 22, marginBottom: space[4] },
  match: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: space[4] },
  block: { marginBottom: space[6] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  li: { fontSize: fontSize.sm, marginBottom: space[1] },
  cta: { marginTop: space[4], marginBottom: space[8] },
  interestedNote: { fontSize: fontSize.sm, textAlign: 'center' },
})
