import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { getChats, type AdminChat } from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import type { AdminStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<AdminStackParamList, 'AdminChats'>

const LIMIT = 25

export function AdminChatsScreen({ navigation }: Props) {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [list, setList] = useState<AdminChat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (p: number, reset: boolean) => {
      setError('')
      try {
        const res = await getChats({ page: p, limit: LIMIT })
        setTotal(res.total)
        setList((prev) => (reset ? res.data : [...prev, ...res.data]))
        setPage(p)
      } catch (e) {
        setError(getApiError(e).message)
        if (reset) setList([])
      }
    },
    []
  )

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      void load(1, true).finally(() => setLoading(false))
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load(1, true)
    setRefreshing(false)
  }

  const loadMore = () => {
    if (loading || list.length >= total) return
    void load(page + 1, false)
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:allChats')}</Text>
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
          ) : (
            <Text style={{ color: c.textMuted }}>{t('admin:noDataYet')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}
            onPress={() => navigation.navigate('AdminChatDetail', { chatId: item.id })}
          >
            <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>
              {item.studentName ?? t('admin:studentProfile')} · {item.universityName ?? t('admin:universityProfile')}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>{item.id}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: space[2], marginBottom: space[2] },
  row: { padding: space[3], borderRadius: radii.md, borderWidth: 1, marginBottom: space[2] },
})
