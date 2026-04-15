import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApplications, getCompareUniversities } from '@/services/student'
import type { StudentStackParamList } from '@/navigation/types'
import type { UniversityListItem } from '@/types/university'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { AppButton } from '@/components/ui/AppButton'
import { AppCard } from '@/components/ui/AppCard'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

const MAX_COMPARE = 4

function toUniversityId(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && ('id' in v || '_id' in v)) {
    return String((v as { id?: unknown; _id?: unknown }).id ?? (v as { _id?: unknown })._id ?? '')
  }
  return ''
}

export function CompareScreen({ navigation }: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const optionsQ = useQuery({
    queryKey: ['compare-options'],
    queryFn: async () => {
      const res = await getApplications({ limit: 100 })
      const ids = [...new Set((res.data ?? []).map((a) => toUniversityId(a.universityId)).filter(Boolean))]
      if (ids.length === 0) return [] as { value: string; label: string }[]
      const list = await getCompareUniversities(ids.slice(0, 20))
      return list.map((u) => ({
        value: u.id,
        label: u.name ?? (u as { universityName?: string }).universityName ?? u.id,
      }))
    },
  })

  const detailQ = useQuery({
    queryKey: ['compare-detail', [...selectedIds].sort().join(',')],
    queryFn: () => getCompareUniversities(selectedIds),
    enabled: selectedIds.length > 0,
  })

  const universities = detailQ.data ?? []

  const addId = useCallback((id: string) => {
    setSelectedIds((s) => {
      if (s.length >= MAX_COMPARE || s.includes(id)) return s
      return [...s, id]
    })
  }, [])

  const removeId = useCallback((id: string) => {
    setSelectedIds((s) => s.filter((x) => x !== id))
  }, [])

  const allOptions = optionsQ.data ?? []
  const available = useMemo(() => allOptions.filter((o) => !selectedIds.includes(o.value)), [allOptions, selectedIds])

  const rows = useMemo(
    () => [
      { label: t('student:compareName'), key: 'name' as const },
      { label: t('student:compareCountry'), key: 'country' as const },
      { label: t('student:compareCity'), key: 'city' as const },
      { label: t('student:compareMinRequirements'), key: 'minLanguageLevel' as const },
      { label: t('student:compareTuition'), key: 'tuitionPrice' as const },
      { label: t('student:compareRating'), key: 'rating' as const },
      { label: t('student:compareMatch'), key: 'matchScore' as const },
      { label: t('student:compareScholarship'), key: 'hasScholarship' as const },
    ],
    [t]
  )

  const formatCell = (u: UniversityListItem, key: string): string => {
    if (key === 'hasScholarship') return u.hasScholarship ? t('common:yes') : t('common:no')
    if (key === 'tuitionPrice') {
      const v = u.tuitionPrice
      if (v == null) return '—'
      return v === 0 ? 'Free' : `${v.toLocaleString()}/yr`
    }
    if (key === 'matchScore' && u.matchScore != null) return `${Math.round(u.matchScore)}%`
    const raw = (u as unknown as Record<string, unknown>)[key]
    return raw != null ? String(raw) : '—'
  }

  return (
    <ScreenScaffold title={t('student:compareTitle')} bottomInset={space[2]}>
      <AppCard flat style={styles.block}>
        <Text style={[styles.h2, { color: c.text }]}>{t('student:selectUpTo', { max: MAX_COMPARE })}</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('student:chooseFromInterested')}</Text>

        {optionsQ.isPending ? (
          <Text style={{ color: c.textMuted }}>{t('common:loading')}</Text>
        ) : allOptions.length === 0 ? (
          <Text style={[styles.hint, { color: c.textMuted }]}>{t('student:noUniversitiesInList')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
            {available.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => addId(o.value)}
                style={[styles.pickChip, { borderColor: c.border, backgroundColor: c.card }]}
              >
                <Text style={{ color: c.primary, fontSize: fontSize.sm }} numberOfLines={1}>
                  + {o.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.selectedRow}>
          {selectedIds.map((id) => {
            const label = allOptions.find((o) => o.value === id)?.label ?? id
            return (
              <Pressable
                key={id}
                onPress={() => removeId(id)}
                style={[styles.tag, { backgroundColor: c.border + '55' }]}
              >
                <Text style={{ color: c.text, fontSize: fontSize.sm }} numberOfLines={1}>
                  {label} ×
                </Text>
              </Pressable>
            )
          })}
        </View>

        <AppButton
          title={t('common:exploreUniversities')}
          variant="secondary"
          onPress={() => navigation.navigate('StudentHome', { path: '/student/universities' })}
        />
      </AppCard>

      {universities.length > 0 ? (
        <AppCard flat style={styles.block}>
          <Text style={[styles.h2, { color: c.text }]}>{t('common:compareUniversities')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={[styles.tableRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.th, { color: c.textMuted, width: 120 }]} />
                {universities.map((u) => (
                  <View key={u.id} style={[styles.colHead, { borderLeftColor: c.border }]}>
                    <Text style={[styles.th, { color: c.text }]} numberOfLines={2}>
                      {u.name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('StudentHome', { path: `/student/universities/${u.id}` })
                      }
                    >
                      <Text style={{ color: c.primary, fontSize: fontSize.xs }}>{t('common:view')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              {rows.map((row) => (
                <View key={row.key} style={[styles.tableRow, { borderBottomColor: c.border }]}>
                  <Text style={[styles.tdLabel, { color: c.text, width: 120 }]} numberOfLines={2}>
                    {row.label}
                  </Text>
                  {universities.map((u) => (
                    <Text
                      key={u.id}
                      style={[styles.td, { color: c.textMuted, borderLeftColor: c.border }]}
                      numberOfLines={3}
                    >
                      {formatCell(u, row.key)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </AppCard>
      ) : null}
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  block: { marginBottom: space[4] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  hint: { fontSize: fontSize.sm, marginBottom: space[3] },
  pickRow: { flexDirection: 'row', gap: space[2], marginBottom: space[3] },
  pickChip: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.full, borderWidth: 1, maxWidth: 200 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[3] },
  tag: { paddingHorizontal: space[2], paddingVertical: space[1], borderRadius: radii.md },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space[2] },
  th: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  colHead: { width: 140, paddingHorizontal: space[2], borderLeftWidth: StyleSheet.hairlineWidth },
  tdLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, paddingRight: space[2] },
  td: { width: 140, fontSize: fontSize.xs, paddingHorizontal: space[2], borderLeftWidth: StyleSheet.hairlineWidth },
})
