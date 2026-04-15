import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApplications } from '@/services/student'
import type { StudentStackParamList } from '@/navigation/types'
import type { Application, ApplicationStatus } from '@/types/student'
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/utils/applicationStatus'
import { formatDate } from '@/utils/formatDate'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { AppCard } from '@/components/ui/AppCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

const STATUSES: ApplicationStatus[] = [
  'interested',
  'under_review',
  'chat_opened',
  'offer_sent',
  'rejected',
  'accepted',
]

const LIMIT = 20

export function StudentApplicationsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation(['student', 'common'])
  const c = useThemeColors()
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['student-applications', page, status],
    queryFn: () =>
      getApplications({
        page,
        limit: LIMIT,
        status: status || undefined,
      }),
  })

  const statusLabel = useCallback(
    (s: ApplicationStatus) =>
      t(`student:applicationStatus_${s}` as 'student:applicationStatus_interested', APPLICATION_STATUS_LABELS[s]),
    [t]
  )

  const chips = useMemo(
    () => [{ value: '', label: t('student:allStatuses') }, ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))],
    [t, statusLabel]
  )

  const applications = query.data?.data ?? []

  const renderItem = useCallback(
    ({ item }: { item: Application }) => {
      const color = applicationStatusColor(item.status, c)
      return (
        <AppCard flat style={styles.card}>
          <Text style={[styles.uniName, { color: c.text }]} numberOfLines={2}>
            {item.universityName ?? item.universityId}
          </Text>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeText, { color }]}>{statusLabel(item.status)}</Text>
          </View>
          <Text style={[styles.dateLine, { color: c.textMuted }]}>
            {t('common:date')}: {formatDate(item.createdAt, i18n.language)}
          </Text>
          <Text style={[styles.dateLine, { color: c.textMuted }]}>
            {t('common:updated')}: {formatDate(item.updatedAt, i18n.language)}
          </Text>
        </AppCard>
      )
    },
    [c, t, i18n.language, statusLabel]
  )

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <FlatList
        horizontal
        data={chips}
        keyExtractor={(item) => item.value || 'all'}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = status === item.value
          return (
            <Pressable
              onPress={() => {
                setStatus(item.value)
                setPage(1)
              }}
              style={[
                styles.chip,
                {
                  borderColor: selected ? c.primary : c.border,
                  backgroundColor: selected ? c.primary : c.card,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? c.onPrimary : c.text,
                  fontWeight: fontWeight.medium,
                  fontSize: fontSize.sm,
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        }}
      />

      {query.isError ? (
        <ErrorState
          title={t('common:error')}
          message={t('common:tryAgainContactSupport')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <ActivityIndicator style={styles.center} color={c.primary} />
      ) : applications.length === 0 ? (
        <EmptyState
          title={t('student:noApplications')}
          description={t('student:noApplicationsDesc')}
          actionLabel={t('student:exploreUniversities')}
          onAction={() => navigation.navigate('StudentHome', { path: '/student/universities' })}
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          ListFooterComponent={
            query.data != null && (query.data.total ?? 0) > page * LIMIT ? (
              <View style={styles.pager}>
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={[styles.pageBtn, { borderColor: c.border, opacity: page <= 1 ? 0.4 : 1 }]}
                >
                  <Text style={{ color: c.text }}>{t('common:prev')}</Text>
                </Pressable>
                <Pressable
                  disabled={page * LIMIT >= (query.data?.total ?? 0)}
                  onPress={() => setPage((p) => p + 1)}
                  style={[
                    styles.pageBtn,
                    {
                      borderColor: c.border,
                      opacity: page * LIMIT >= (query.data?.total ?? 0) ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: c.text }}>{t('common:next')}</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipsScroll: { maxHeight: 52, flexGrow: 0 },
  chipsContent: { paddingHorizontal: space[4], paddingVertical: space[2], gap: space[2] },
  chip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: space[2],
  },
  list: { padding: space[4], gap: space[3], paddingBottom: space[10] },
  card: { marginBottom: 0 },
  uniName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: space[2] },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space[2], paddingVertical: space[1], borderRadius: radii.full },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  dateLine: { fontSize: fontSize.xs, marginTop: space[1] },
  center: { marginTop: space[10] },
  pager: { flexDirection: 'row', justifyContent: 'center', gap: space[4], paddingVertical: space[4] },
  pageBtn: { paddingVertical: space[2], paddingHorizontal: space[4], borderRadius: radii.md, borderWidth: 1 },
})
