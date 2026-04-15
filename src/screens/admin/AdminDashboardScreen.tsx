import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import {
  getAdminDashboard,
  getHealth,
  getUniversityInterestAnalytics,
  type AdminDashboardResponse,
  type UniversityInterestAnalyticsItem,
} from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import type { AdminStackParamList, AdminTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList, 'AdminDashboard'>,
  StackNavigationProp<AdminStackParamList>
>

export function AdminDashboardScreen() {
  const { t } = useTranslation('admin')
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [dash, setDash] = useState<AdminDashboardResponse | null>(null)
  const [interests, setInterests] = useState<UniversityInterestAnalyticsItem[]>([])
  const [healthOk, setHealthOk] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return Promise.all([
      getAdminDashboard(),
      getUniversityInterestAnalytics(20),
      getHealth().catch(() => ({ status: 'error', services: [] as { status: string }[] })),
    ])
      .then(([d, int, h]) => {
        setDash(d)
        setInterests(int)
        setHealthOk(h.status !== 'error' && (h.services?.length ? h.services.every((s) => s.status === 'up') : true))
      })
      .catch((e) => setError(getApiError(e).message))
  }, [])

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

  const mrr = dash?.mrr
  const plans = dash?.subscriptionsByPlan

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <Text style={[styles.h1, { color: c.text }]}>{t('dashboard')}</Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={c.primary} style={{ marginBottom: space[3] }} /> : null}

        <View style={styles.grid}>
          <Metric
            title={t('mobileTotalUsers')}
            value={dash != null ? String(dash.users) : '—'}
            onPress={() => navigation.navigate('AdminUsers')}
            c={c}
          />
          <Metric
            title={t('universities')}
            value={dash != null ? String(dash.universities) : '—'}
            onPress={() => navigation.navigate('AdminVerification')}
            c={c}
          />
          <Metric
            title={t('activeOffers')}
            value={dash != null ? String(dash.pendingOffers) : '—'}
            c={c}
          />
          <Metric
            title={t('mobilePendingVerification')}
            value={dash != null ? String(dash.pendingVerification) : '—'}
            onPress={() => navigation.navigate('AdminVerification')}
            c={c}
          />
        </View>

        <Pressable style={[styles.healthRow, { borderColor: c.border }]} onPress={() => navigation.navigate('AdminHealth')}>
          <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{t('systemHealth')}</Text>
          <Text style={{ color: healthOk ? c.success : c.danger, fontWeight: fontWeight.semibold }}>
            {healthOk ? t('healthOk') : t('healthError')}
          </Text>
        </Pressable>

        {mrr != null ? (
          <Text style={[styles.mrr, { color: c.textMuted }]}>
            {t('mobileMrr')}: {mrr}
          </Text>
        ) : null}
        {plans && Object.keys(plans).length > 0 ? (
          <View style={[styles.plans, { borderColor: c.border }]}>
            <Text style={{ color: c.text, fontWeight: fontWeight.semibold, marginBottom: space[2] }}>
              {t('mobileSubscriptions')}
            </Text>
            {Object.entries(plans).map(([k, v]) => (
              <View key={k} style={styles.planRow}>
                <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{k}</Text>
                <Text style={{ color: c.text, fontSize: fontSize.sm }}>{v}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.h2, { color: c.text }]}>{t('universitiesByStudentInterest')}</Text>
          <Pressable onPress={() => navigation.navigate('AdminUniversityRequests')}>
            <Text style={{ color: c.primary, fontSize: fontSize.sm }}>{t('mobileOpenRequests')}</Text>
          </Pressable>
        </View>
        {interests.length === 0 && !loading ? (
          <Text style={{ color: c.textMuted }}>{t('noDataYet')}</Text>
        ) : (
          interests.map((row, i) => (
            <View
              key={`${row.source}-${row.universityId}`}
              style={[styles.interestRow, { borderColor: c.border, backgroundColor: c.card }]}
            >
              <Text style={{ color: c.textMuted, width: 28 }}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text }}>{row.universityName}</Text>
                {row.source === 'catalog' ? (
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>(catalog)</Text>
                ) : null}
              </View>
              <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{row.interestCount}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({
  title,
  value,
  onPress,
  c,
}: {
  title: string
  value: string
  onPress?: () => void
  c: ReturnType<typeof useThemeColors>
}) {
  const body = (
    <>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{title}</Text>
      <Text style={{ color: c.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: 4 }}>{value}</Text>
    </>
  )
  const style = [styles.metric, { borderColor: c.border, backgroundColor: c.card }]
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {body}
      </Pressable>
    )
  }
  return <View style={style}>{body}</View>
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[3] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[3] },
  metric: { width: '47%', padding: space[3], borderRadius: radii.md, borderWidth: 1 },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space[3],
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: space[3],
  },
  mrr: { fontSize: fontSize.sm, marginBottom: space[2] },
  plans: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[4] },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[2] },
  interestRow: { flexDirection: 'row', alignItems: 'center', padding: space[3], borderRadius: radii.md, borderWidth: 1, marginBottom: space[2] },
})
