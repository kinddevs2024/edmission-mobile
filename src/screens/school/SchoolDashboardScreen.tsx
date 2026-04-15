import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getCounsellorProfile, listJoinRequests, listMyStudents } from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import type { SchoolStackParamList, SchoolTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SchoolTabParamList, 'SchoolDashboard'>,
  StackNavigationProp<SchoolStackParamList>
>

export function SchoolDashboardScreen() {
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [schoolName, setSchoolName] = useState('')
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [recentStudents, setRecentStudents] = useState<{ userId: string; label: string }[]>([])
  const [recentRequests, setRecentRequests] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    Promise.all([
      getCounsellorProfile(),
      listMyStudents({ page: 1, limit: 5 }),
      listJoinRequests({ status: 'pending', page: 1, limit: 5 }),
      listJoinRequests({ status: 'pending', page: 1, limit: 1 }),
    ])
      .then(([profile, studentsRes, requestsRes, pendingCountRes]) => {
        setSchoolName(profile.schoolName || '')
        setStudentsTotal(studentsRes.total ?? 0)
        setPendingTotal(pendingCountRes.total ?? 0)
        setRecentStudents(
          (studentsRes.data ?? []).map((s) => ({
            userId: s.userId,
            label: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.email || '—',
          }))
        )
        setRecentRequests(
          (requestsRes.data ?? []).map((r) => ({
            id: r.id,
            label: `${r.studentName}${r.studentEmail ? ` · ${r.studentEmail}` : ''}`,
          }))
        )
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load])
  )

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: c.text }]}>{t('school:dashboard')}</Text>
        {schoolName ? (
          <Text style={[styles.sub, { color: c.textMuted }]}>{schoolName}</Text>
        ) : null}
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={c.primary} style={{ marginBottom: space[3] }} /> : null}

        <View style={styles.grid}>
          <DashCard
            title={t('school:statsStudents')}
            value={loading ? '—' : String(studentsTotal)}
            hint={t('school:myStudents')}
            onPress={() => navigation.navigate('CounsellorStudents')}
            c={c}
          />
          <DashCard
            title={t('school:statsPending')}
            value={loading ? '—' : String(pendingTotal)}
            hint={t('school:joinRequests')}
            onPress={() => navigation.navigate('CounsellorJoinRequests')}
            c={c}
            highlight={pendingTotal > 0}
          />
          <DashCard
            title={t('school:mySchool')}
            value=""
            hint={t('school:mySchoolHint')}
            onPress={() => navigation.navigate('CounsellorSchoolProfile')}
            c={c}
          />
        </View>

        <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>{t('school:recentStudents')}</Text>
          {recentStudents.length === 0 && !loading ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{t('school:noStudentsYet')}</Text>
          ) : (
            recentStudents.map((s) => (
              <Pressable
                key={s.userId}
                style={styles.row}
                onPress={() => navigation.navigate('CounsellorStudentProfile', { studentId: s.userId })}
              >
                <Text style={{ color: c.text, fontSize: fontSize.sm }}>{s.label}</Text>
              </Pressable>
            ))
          )}
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('CounsellorStudents')}>
            <Text style={{ color: c.primary }}>{t('school:viewAll')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>{t('school:recentRequests')}</Text>
          {recentRequests.length === 0 && !loading ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{t('school:noPendingRequests')}</Text>
          ) : (
            recentRequests.map((r) => (
              <Text key={r.id} style={{ color: c.text, fontSize: fontSize.sm, marginBottom: 6 }}>
                {r.label}
              </Text>
            ))
          )}
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('CounsellorJoinRequests')}>
            <Text style={{ color: c.primary }}>{t('school:viewAll')}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('CounsellorStudentInterests')}>
          <Text style={{ color: c.primary }}>{t('school:studentInterestsNav')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function DashCard({
  title,
  value,
  hint,
  onPress,
  c,
  highlight,
}: {
  title: string
  value: string
  hint: string
  onPress: () => void
  c: ReturnType<typeof useThemeColors>
  highlight?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dashCard,
        {
          borderColor: highlight ? c.warning : c.border,
          backgroundColor: c.card,
        },
      ]}
    >
      <Text style={[styles.dashTitle, { color: c.text }]}>{title}</Text>
      {value ? <Text style={[styles.dashValue, { color: c.text }]}>{value}</Text> : null}
      <Text style={[styles.dashHint, { color: c.textMuted }]}>{hint}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[1] },
  sub: { fontSize: fontSize.sm, marginBottom: space[3] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginBottom: space[4] },
  dashCard: {
    flexGrow: 1,
    minWidth: '45%',
    padding: space[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  dashTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dashValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginTop: 4 },
  dashHint: { fontSize: fontSize.xs, marginTop: 6 },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[4], marginBottom: space[4] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: space[2] },
  row: { paddingVertical: 8 },
  linkBtn: { marginTop: space[2], alignSelf: 'flex-start' },
})
