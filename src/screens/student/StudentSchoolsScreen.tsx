import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import {
  acceptSchoolInvitation,
  declineSchoolInvitation,
  listSchoolInvitations,
  listSchools,
  requestToJoinSchool,
  type SchoolInvitationItem,
} from '@/services/student'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { AppCard } from '@/components/ui/AppCard'
import { AppButton } from '@/components/ui/AppButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

export function StudentSchoolsScreen(_props: Props) {
  const { t } = useTranslation(['student', 'common', 'admin'])
  const c = useThemeColors()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const schoolsQ = useQuery({
    queryKey: ['student-schools', debounced, page],
    queryFn: () => listSchools({ search: debounced.trim() || undefined, page, limit: 15 }),
  })

  const invQ = useQuery({
    queryKey: ['student-school-invitations'],
    queryFn: listSchoolInvitations,
  })

  const requestMut = useMutation({
    mutationFn: requestToJoinSchool,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-schools'] })
    },
  })

  const acceptMut = useMutation({
    mutationFn: acceptSchoolInvitation,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-school-invitations'] })
    },
  })

  const declineMut = useMutation({
    mutationFn: declineSchoolInvitation,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-school-invitations'] })
    },
  })

  const onSearchChange = useCallback((text: string) => {
    setSearch(text)
    setPage(1)
  }, [])

  const list = schoolsQ.data?.data ?? []
  const totalPages = schoolsQ.data ? Math.max(1, Math.ceil(schoolsQ.data.total / (schoolsQ.data.limit || 15))) : 1

  return (
    <ScreenScaffold title={t('student:linkToMySchool')} bottomInset={space[2]}>
      <Text style={[styles.hint, { color: c.textMuted }]}>{t('student:linkToSchoolHint')}</Text>

      {invQ.data && invQ.data.length > 0 ? (
        <View style={styles.invBlock}>
          <Text style={[styles.h2, { color: c.text }]}>{t('student:schoolInvitations')}</Text>
          {invQ.data.map((inv: SchoolInvitationItem) => (
            <AppCard key={inv.id} flat style={styles.card}>
              <Text style={[styles.schoolName, { color: c.text }]}>{inv.schoolName}</Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {[inv.city, inv.country].filter(Boolean).join(', ')}
              </Text>
              <View style={styles.row}>
                <AppButton
                  title={t('common:yes')}
                  loading={acceptMut.isPending}
                  onPress={() => acceptMut.mutate(inv.id)}
                />
                <AppButton
                  title={t('common:no')}
                  variant="secondary"
                  loading={declineMut.isPending}
                  onPress={() => declineMut.mutate(inv.id)}
                />
              </View>
            </AppCard>
          ))}
        </View>
      ) : null}

      <View style={[styles.searchRow, { borderColor: c.border, backgroundColor: c.card }]}>
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('common:searchPlaceholder')}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { color: c.text }]}
        />
      </View>

      {schoolsQ.isError ? (
        <ErrorState
          title={t('common:error')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void schoolsQ.refetch()}
        />
      ) : schoolsQ.isPending ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.counsellorUserId}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ opacity: page <= 1 ? 0.4 : 1 }}
                >
                  <Text style={{ color: c.primary }}>{t('common:prev')}</Text>
                </Pressable>
                <Pressable
                  disabled={page >= totalPages}
                  onPress={() => setPage((p) => p + 1)}
                  style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                >
                  <Text style={{ color: c.primary }}>{t('common:next')}</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <AppCard flat style={styles.card}>
              <Text style={[styles.schoolName, { color: c.text }]}>{item.schoolName}</Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {[item.city, item.country].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>{item.counsellorName}</Text>
              <AppButton
                title={
                  item.requestStatus === 'pending'
                    ? t('admin:requestSent', 'Request sent')
                    : t('student:chooseSchool', 'Request')
                }
                disabled={item.requestStatus === 'pending'}
                loading={requestMut.isPending}
                onPress={() => {
                  requestMut.mutate(item.counsellorUserId, {
                    onError: (e) => {
                      if (axios.isAxiosError(e)) {
                        const data = e.response?.data as { code?: string; message?: string } | undefined
                        const code = data?.code
                        const msg = String(data?.message ?? '').toLowerCase()
                        if (code === 'CONFLICT' && (msg.includes('request already') || msg.includes('already in'))) {
                          void qc.invalidateQueries({ queryKey: ['student-schools'] })
                          return
                        }
                      }
                    },
                  })
                }}
              />
            </AppCard>
          )}
        />
      )}
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, marginBottom: space[4] },
  invBlock: { marginBottom: space[6] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  searchRow: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: space[3], marginBottom: space[4] },
  input: { paddingVertical: space[3], fontSize: fontSize.base },
  list: { paddingBottom: space[10], gap: space[3] },
  card: { marginBottom: space[2] },
  schoolName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm, marginTop: space[1] },
  row: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  pager: { flexDirection: 'row', justifyContent: 'space-between', padding: space[4] },
})
