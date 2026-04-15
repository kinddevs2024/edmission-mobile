import { useCallback } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listIssuedDocuments } from '@/services/documentsIssued'
import type { StudentStackParamList } from '@/navigation/types'
import type { UniversityDocumentSummary } from '@/types/documents'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import { formatDate } from '@/utils/formatDate'
import { AppCard } from '@/components/ui/AppCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

export function StudentOffersScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation(['documents', 'common', 'student'])
  const c = useThemeColors()

  const query = useQuery({
    queryKey: ['issued-documents-student'],
    queryFn: () => listIssuedDocuments(),
  })

  const openDoc = useCallback(
    (id: string) => {
      navigation.navigate('StudentHome', { path: `/student/received-documents/${id}` })
    },
    [navigation]
  )

  const renderItem = useCallback(
    ({ item }: { item: UniversityDocumentSummary }) => (
      <AppCard flat style={styles.card}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {item.title ?? t('documents:common.document', 'Document')}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {item.university?.name ?? t('documents:common.university', 'University')}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('documents:studentOffers.type', 'Type')}:{' '}
          {item.type === 'offer'
            ? t('documents:type.offer', 'Offer')
            : t('documents:type.scholarship', 'Scholarship')}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('documents:studentOffers.sent', 'Sent')}: {formatDate(item.sentAt, i18n.language)}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('documents:studentOffers.deadline', 'Deadline')}:{' '}
          {item.expiresAt ? formatDate(item.expiresAt, i18n.language) : t('documents:summary.openEnded', 'Open ended')}
        </Text>
        <Pressable onPress={() => openDoc(item.id)} style={styles.btn}>
          <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>
            {t('documents:studentOffers.openDocument', 'Open document')}
          </Text>
        </Pressable>
      </AppCard>
    ),
    [c, t, i18n.language, openDoc]
  )

  return (
    <ScreenScaffold
      title={t('documents:studentOffers.pageTitle', 'Offers & Scholarships')}
      bottomInset={space[2]}
    >
      {query.isError ? (
        <ErrorState
          title={t('common:error')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? null : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title={t('documents:studentOffers.emptyTitle', 'No documents yet')}
          description={t(
            'documents:studentOffers.emptyDescription',
            'When a university sends you an offer or scholarship, it will appear here.'
          )}
          actionLabel={t('common:exploreUniversities')}
          onAction={() => navigation.navigate('StudentHome', { path: '/student/universities' })}
        />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
        />
      )}
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[8], gap: space[3] },
  card: { marginBottom: space[2] },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm, marginTop: space[1] },
  btn: { marginTop: space[3], alignSelf: 'flex-start' },
})
