import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { EXPLORE_COUNTRIES, type ExploreSort } from '@/constants/studentExplore'
import { getUniversities } from '@/services/student'
import type { StudentStackParamList, StudentTabParamList } from '@/navigation/types'
import type { UniversityListItem } from '@/types/university'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { getImageUrl } from '@/utils/imageUrl'
import { AppCard } from '@/components/ui/AppCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

const PAGE_SIZE = 12

const SORT_OPTIONS: { value: ExploreSort; labelKey: string; def: string }[] = [
  { value: 'match', labelKey: 'student:matchScore', def: 'Match' },
  { value: 'name', labelKey: 'student:compareName', def: 'Name' },
  { value: 'tuition_asc', labelKey: 'student:sortTuitionLow', def: 'Tuition ↑' },
  { value: 'tuition_desc', labelKey: 'student:sortTuitionHigh', def: 'Tuition ↓' },
  { value: 'newest', labelKey: 'student:sortNewest', def: 'Newest' },
]

export function ExploreUniversitiesScreen({ navigation }: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [country, setCountry] = useState('')
  const [sort, setSort] = useState<ExploreSort>('match')
  const [hasScholarship, setHasScholarship] = useState(false)
  const [useProfileFilters, setUseProfileFilters] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const query = useInfiniteQuery({
    queryKey: ['student-universities', debounced, country, sort, hasScholarship, useProfileFilters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      getUniversities({
        page: pageParam,
        limit: PAGE_SIZE,
        search: debounced.trim() || undefined,
        country: country || undefined,
        sort,
        hasScholarship: hasScholarship || undefined,
        useProfileFilters,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.data.length, 0)
      if (loaded >= lastPage.total) return undefined
      return (lastPage.page ?? allPages.length) + 1
    },
  })

  const flatData = query.data?.pages.flatMap((p) => p.data) ?? []

  const onRefresh = useCallback(() => {
    void query.refetch()
  }, [query])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }, [query])

  const renderItem = useCallback(
    ({ item }: { item: UniversityListItem }) => {
      const logoUri = item.logo ? getImageUrl(item.logo) : ''
      const sub = [item.city, item.country].filter(Boolean).join(', ')
      return (
        <AppCard
          onPress={() => navigation.navigate('StudentHome', { path: `/student/universities/${item.id}` })}
          style={{ marginBottom: space[3] }}
        >
          <View style={styles.cardRow}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPh, { backgroundColor: c.primaryMuted }]}>
                <Text style={[styles.logoPhText, { color: c.primary }]}>{item.name.slice(0, 1)}</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              {sub ? (
                <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
                  {sub}
                </Text>
              ) : null}
              {item.matchScore != null ? (
                <Text style={[styles.match, { color: c.primary }]}>
                  {t('student:matchScore')}: {Math.round(item.matchScore)}%
                </Text>
              ) : null}
            </View>
          </View>
        </AppCard>
      )
    },
    [navigation, c, t]
  )

  const listEmpty =
    !query.isPending &&
    !query.isError &&
    flatData.length === 0 &&
    !query.isFetching

  const filterHeader = (
    <View style={[styles.filterBlock, { borderBottomColor: c.border }]}>
      <View style={[styles.searchRow, { backgroundColor: c.card, borderColor: c.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('common:searchPlaceholder')}
          placeholderTextColor={c.textMuted}
          style={[styles.searchInput, { color: c.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text style={[styles.filterLabel, { color: c.textMuted }]}>{t('student:allCountries')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        <ExploreChip
          label={t('student:allCountries')}
          selected={country === ''}
          onPress={() => setCountry('')}
        />
        {EXPLORE_COUNTRIES.map((co) => (
          <ExploreChip key={co} label={co} selected={country === co} onPress={() => setCountry(co)} />
        ))}
      </ScrollView>

      <Text style={[styles.filterLabel, { color: c.textMuted }]}>{t('student:sort')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {SORT_OPTIONS.map((opt) => (
          <ExploreChip
            key={opt.value}
            label={t(opt.labelKey as 'student:matchScore', opt.def)}
            selected={sort === opt.value}
            onPress={() => setSort(opt.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setHasScholarship((v) => !v)}
          style={[
            styles.toggleChip,
            {
              borderColor: hasScholarship ? c.primary : c.border,
              backgroundColor: hasScholarship ? c.primaryMuted : c.card,
            },
          ]}
        >
          <Text style={{ color: c.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
            {t('student:compareScholarship')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUseProfileFilters((v) => !v)}
          style={[
            styles.toggleChip,
            {
              borderColor: useProfileFilters ? c.primary : c.border,
              backgroundColor: useProfileFilters ? c.primaryMuted : c.card,
            },
          ]}
        >
          <Text style={{ color: c.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
            {t('student:navProfile')}
          </Text>
        </Pressable>
      </View>
      {!useProfileFilters ? (
        <Text style={[styles.profileHint, { color: c.textMuted }]}>{t('student:profileFilterNoMatches')}</Text>
      ) : null}
    </View>
  )

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {query.isError ? (
        <ErrorState
          title={t('common:error')}
          message={t('common:tryAgainContactSupport')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
      ) : listEmpty ? (
        <>
          {filterHeader}
          <EmptyState
            title={t('student:noUniversitiesFound')}
            description={t('student:tryChangingFiltersOrSearch')}
          />
        </>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              {filterHeader}
              {query.isPending ? (
                <ActivityIndicator style={styles.headerLoader} color={c.primary} />
              ) : null}
            </>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} tintColor={c.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={c.primary} />
            ) : null
          }
          removeClippedSubviews={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterBlock: { paddingBottom: space[3], borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: space[2] },
  filterLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginLeft: space[4], marginTop: space[2], marginBottom: space[1] },
  searchRow: {
    marginHorizontal: space[4],
    marginTop: space[2],
    marginBottom: space[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space[3],
  },
  searchInput: { paddingVertical: space[3], fontSize: fontSize.base },
  chipsRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: space[2], paddingHorizontal: space[4], paddingBottom: space[2] },
  chip: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.full, borderWidth: 1, marginRight: space[2] },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingHorizontal: space[4], marginTop: space[2] },
  toggleChip: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.md, borderWidth: 1 },
  profileHint: { fontSize: fontSize.xs, marginHorizontal: space[4], marginTop: space[2] },
  list: { paddingHorizontal: space[4], paddingBottom: space[8] },
  cardRow: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  logo: { width: 48, height: 48, borderRadius: radii.sm },
  logoPh: { alignItems: 'center', justifyContent: 'center' },
  logoPhText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  cardBody: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.sm, marginTop: space[1] },
  match: { fontSize: fontSize.xs, marginTop: space[1], fontWeight: fontWeight.medium },
  footer: { padding: space[4] },
  headerLoader: { padding: space[4] },
})

function ExploreChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  const c = useThemeColors()
  return (
    <Pressable
      onPress={onPress}
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
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
}
