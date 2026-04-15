import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { RouteProp } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import {
  addInterestForStudent,
  listMyStudents,
  listStudentUniversities,
  type CounsellorStudent,
} from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import type { SchoolTabParamList } from '@/navigation/types'
import type { UniversityListItem } from '@/types/university'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

const LIMIT = 12

type Route = RouteProp<SchoolTabParamList, 'CounsellorStudentInterests'>

export function CounsellorStudentInterestsScreen() {
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const route = useRoute<Route>()
  const preselect = route.params?.preselectStudentUserId

  const [students, setStudents] = useState<CounsellorStudent[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [useProfileFilters, setUseProfileFilters] = useState(true)
  const [page, setPage] = useState(1)
  const [uniList, setUniList] = useState<UniversityListItem[]>([])
  const [uniTotal, setUniTotal] = useState(0)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingUnis, setLoadingUnis] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    void listMyStudents({ page: 1, limit: 100 })
      .then((res) => {
        const data = res.data ?? []
        setStudents(data)
        if (preselect && data.some((s) => s.userId === preselect)) {
          setSelectedId(preselect)
        } else if (data[0]) {
          setSelectedId(data[0].userId)
        }
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoadingStudents(false))
  }, [preselect])

  const loadUniversities = useCallback(
    async (p: number, reset: boolean) => {
      if (!selectedId) return
      setError('')
      setLoadingUnis(true)
      try {
        const res = await listStudentUniversities(selectedId, {
          page: p,
          limit: LIMIT,
          country: country.trim() || undefined,
          city: city.trim() || undefined,
          useProfileFilters,
        })
        setUniTotal(res.total ?? 0)
        setUniList((prev) => (reset ? res.data ?? [] : [...prev, ...(res.data ?? [])]))
        setPage(p)
      } catch (e) {
        setError(getApiError(e).message)
        if (reset) setUniList([])
      } finally {
        setLoadingUnis(false)
      }
    },
    [selectedId, country, city, useProfileFilters]
  )

  useEffect(() => {
    if (!selectedId) return
    setPage(1)
    void loadUniversities(1, true)
  }, [selectedId, country, city, useProfileFilters, loadUniversities])

  const onRefresh = async () => {
    if (!selectedId) return
    setRefreshing(true)
    await loadUniversities(1, true)
    setRefreshing(false)
  }

  const loadMore = () => {
    if (!selectedId || loadingUnis || uniList.length >= uniTotal) return
    void loadUniversities(page + 1, false)
  }

  const uniName = (u: UniversityListItem) => u.name || (u as { universityName?: string }).universityName || '—'

  const sendInterest = async (universityId: string) => {
    if (!selectedId) return
    setSendingId(universityId)
    try {
      await addInterestForStudent(selectedId, universityId)
      Alert.alert(t('common:success'), t('school:interestSent'))
      await loadUniversities(1, true)
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setSendingId(null)
    }
  }

  if (loadingStudents) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('school:studentInterestsTitle')}</Text>
      {students.length === 0 ? (
        <Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('school:studentInterestsNoStudentsHint')}</Text>
      ) : (
        <>
          <Text style={[styles.label, { color: c.textMuted }]}>{t('school:studentInterestsSelectStudent')}</Text>
          <View style={styles.chips}>
            {students.map((s) => {
              const label = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.email
              const active = s.userId === selectedId
              return (
                <Pressable
                  key={s.userId}
                  onPress={() => setSelectedId(s.userId)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? c.primary : c.border,
                      backgroundColor: active ? c.primaryMuted ?? c.card : c.card,
                    },
                  ]}
                >
                  <Text style={{ color: active ? c.primary : c.text, fontSize: fontSize.sm }} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={[styles.filters, { borderColor: c.border }]}>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder={t('school:filterCountryPlaceholder')}
              placeholderTextColor={c.textMuted}
              style={[styles.filterInput, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t('school:filterCityPlaceholder')}
              placeholderTextColor={c.textMuted}
              style={[styles.filterInput, { borderColor: c.border, color: c.text }]}
            />
            <View style={styles.switchRow}>
              <Text style={{ color: c.text, flex: 1, fontSize: fontSize.sm }}>{t('school:useProfileFilters')}</Text>
              <Switch value={useProfileFilters} onValueChange={setUseProfileFilters} />
            </View>
          </View>

          {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('school:studentInterestsUniversities')}</Text>

          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: space[8] }}
            data={uniList}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              loadingUnis ? (
                <ActivityIndicator color={c.primary} style={{ marginTop: space[4] }} />
              ) : (
                <Text style={{ color: c.textMuted }}>—</Text>
              )
            }
            renderItem={({ item }) => (
              <View style={[styles.uniRow, { borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{uniName(item)}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>
                    {[item.country, item.city].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable
                  style={[styles.interestBtn, { backgroundColor: c.primary, opacity: sendingId === item.id ? 0.6 : 1 }]}
                  onPress={() => void sendInterest(item.id)}
                  disabled={sendingId != null}
                >
                  {sendingId === item.id ? (
                    <ActivityIndicator color={c.onPrimary} size="small" />
                  ) : (
                    <Text style={{ color: c.onPrimary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                      {t('school:studentInterestsMarkInterested')}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[3], marginTop: space[2] },
  label: { fontSize: fontSize.xs, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space[3] },
  chip: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.md, borderWidth: 1, maxWidth: '100%' },
  filters: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  filterInput: { borderWidth: 1, borderRadius: radii.md, padding: space[2], marginBottom: space[2], fontSize: fontSize.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: space[1] },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: space[2] },
  uniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space[3],
    marginBottom: space[2],
  },
  interestBtn: { paddingHorizontal: space[2], paddingVertical: space[2], borderRadius: radii.md, minWidth: 88, alignItems: 'center' },
})
