import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import {
  approveUniversityRequest,
  getUniversityVerificationRequests,
  rejectUniversityRequest,
  type UniversityVerificationRequestItem,
} from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function AdminUniversityRequestsScreen() {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [list, setList] = useState<UniversityVerificationRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getUniversityVerificationRequests(filter === 'pending' ? { status: 'pending' } : undefined)
      .then(setList)
      .catch((e) => {
        setError(getApiError(e).message)
        setList([])
      })
  }, [filter])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      void load().finally(() => setLoading(false))
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const act = (item: UniversityVerificationRequestItem, approve: boolean) => {
    if (item.status !== 'pending') return
    Alert.alert(
      approve ? t('admin:mobileRequestApprove') : t('admin:mobileRequestReject'),
      item.university?.name ?? item.userEmail ?? item.id,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: approve ? t('admin:approve') : t('admin:reject'),
          style: approve ? 'default' : 'destructive',
          onPress: () => {
            const fn = approve ? approveUniversityRequest : rejectUniversityRequest
            void fn(item.id)
              .then(() => load())
              .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:universityRequests')}</Text>
      <View style={styles.filters}>
        <Pressable
          onPress={() => setFilter('pending')}
          style={[
            styles.filterBtn,
            { borderColor: c.border, backgroundColor: filter === 'pending' ? c.primaryMuted : c.card },
          ]}
        >
          <Text style={{ color: c.text, fontSize: fontSize.sm }}>{t('admin:mobileFilterPending')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('all')}
          style={[
            styles.filterBtn,
            { borderColor: c.border, backgroundColor: filter === 'all' ? c.primaryMuted : c.card },
          ]}
        >
          <Text style={{ color: c.text, fontSize: fontSize.sm }}>{t('admin:mobileFilterAll')}</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={<Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('admin:noDataYet')}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>
                {item.university?.name ?? '—'}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>{item.userEmail}</Text>
              <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
                {item.status} · {item.createdAt?.slice(0, 10)}
              </Text>
              {item.status === 'pending' ? (
                <View style={styles.row}>
                  <Pressable style={[styles.btn, { backgroundColor: c.success }]} onPress={() => act(item, true)}>
                    <Text style={styles.btnTxt}>{t('admin:approve')}</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, { backgroundColor: c.danger }]} onPress={() => act(item, false)}>
                    <Text style={styles.btnTxt}>{t('admin:reject')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: space[2], marginBottom: space[2] },
  filters: { flexDirection: 'row', gap: space[2], marginBottom: space[3] },
  filterBtn: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.md, borderWidth: 1 },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  row: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  btn: { flex: 1, paddingVertical: space[2], borderRadius: radii.md, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: fontWeight.semibold },
})
