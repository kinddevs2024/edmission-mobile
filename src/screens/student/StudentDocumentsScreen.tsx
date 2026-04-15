import { useCallback } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { deleteStudentDocument, getMyDocuments, type StudentDocumentItem } from '@/services/studentDocuments'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { AppCard } from '@/components/ui/AppCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function StudentDocumentsScreen({ navigation }: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()
  const qc = useQueryClient()

  const query = useQuery({ queryKey: ['student-documents'], queryFn: getMyDocuments })

  const del = useMutation({
    mutationFn: deleteStudentDocument,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-documents'] })
    },
  })

  const confirmDelete = useCallback(
    (item: StudentDocumentItem) => {
      Alert.alert(t('common:remove'), item.name ?? item.type, [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:remove'),
          style: 'destructive',
          onPress: () => del.mutate(item.id),
        },
      ])
    },
    [t, del]
  )

  return (
    <ScreenScaffold title={t('student:navDocuments')} bottomInset={space[2]}>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        {t('student:navDocuments')} — list and delete via API. File upload and canvas editor come in a later phase.
      </Text>

      {query.isError ? (
        <ErrorState
          title={t('common:error')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? null : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title={t('common:documents')} description={t('student:stepUploadDocument')} />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <AppCard flat style={styles.card}>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
                {item.name ?? item.type}
              </Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {item.type} · {item.source} · {STATUS_LABEL[item.status] ?? item.status}
              </Text>
              {item.rejectionReason ? (
                <Text style={[styles.warn, { color: c.danger }]}>{item.rejectionReason}</Text>
              ) : null}
              <Pressable onPress={() => confirmDelete(item)} style={styles.dangerBtn}>
                <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:remove')}</Text>
              </Pressable>
            </AppCard>
          )}
        />
      )}
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, marginBottom: space[4], paddingHorizontal: space[1] },
  list: { paddingBottom: space[8], gap: space[3] },
  card: { marginBottom: space[2] },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.sm, marginTop: space[1] },
  warn: { fontSize: fontSize.sm, marginTop: space[2] },
  dangerBtn: { marginTop: space[3], alignSelf: 'flex-start' },
})
