import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getUniversityStudents, type DiscoverStudentItem } from '@/services/university'
import { getApiError } from '@/services/auth'
import { getStudentDisplayName } from '@/utils/studentDisplay'
import type { UniversityStackParamList, UniversityTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<UniversityTabParamList, 'UniversityDiscovery'>,
  StackNavigationProp<UniversityStackParamList>
>

const LIMIT = 20

export function UniversityDiscoveryScreen() {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [list, setList] = useState<DiscoverStudentItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t0 = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(t0)
  }, [search])

  const load = useCallback(
    async (p: number, reset: boolean) => {
      setError('')
      try {
        const res = await getUniversityStudents({
          page: p,
          limit: LIMIT,
          search: debounced || undefined,
        })
        setTotal(res.total ?? 0)
        setList((prev) => (reset ? res.data ?? [] : [...prev, ...(res.data ?? [])]))
        setPage(p)
      } catch (e) {
        setError(getApiError(e).message)
        if (reset) setList([])
      }
    },
    [debounced]
  )

  useEffect(() => {
    setLoading(true)
    void load(1, true).finally(() => setLoading(false))
  }, [debounced, load])

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
      <Text style={[styles.h1, { color: c.text }]}>{t('university:navDiscovery')}</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('common:searchPlaceholder')}
        placeholderTextColor={c.textMuted}
        style={[styles.input, { borderColor: c.border, color: c.text }]}
      />
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
      {loading && list.length === 0 ? (
        <ActivityIndicator color={c.primary} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          onEndReachedThreshold={0.3}
          onEndReached={() => loadMore()}
          ListEmptyComponent={
            <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: space[8] }}>
              {t('university:discoveryEmptyDesc', 'No students yet.')}
            </Text>
          }
          renderItem={({ item }) => {
            const name = getStudentDisplayName(item.student, 'Student')
            const sub = [item.student.city, item.student.country].filter(Boolean).join(', ')
            const privateVis = item.student.profileVisibility === 'private'
            return (
              <Pressable
                style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}
                onPress={() => navigation.navigate('UniversityStudentProfile', { studentId: item.id })}
              >
                <Text style={[styles.name, { color: c.text }]}>{privateVis ? '—' : name}</Text>
                {sub && !privateVis ? <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{sub}</Text> : null}
                {item.inPipeline ? (
                  <Text style={{ color: c.primary, fontSize: fontSize.xs, marginTop: 4 }}>
                    {t('university:viewPipeline', 'In pipeline')}
                  </Text>
                ) : null}
              </Pressable>
            )
          }}
          contentContainerStyle={{ paddingBottom: space[10], gap: space[2] }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[3] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3] },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
})
