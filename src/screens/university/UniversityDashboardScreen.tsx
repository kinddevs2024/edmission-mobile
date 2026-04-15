import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getUniversityDashboard, type UniversityDashboardData } from '@/services/university'
import { getApiError } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { TutorialOverlay } from '@/components/TutorialOverlay'
import { getStudentDisplayName } from '@/utils/studentDisplay'
import type { UniversityStackParamList, UniversityTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<UniversityTabParamList, 'UniversityDashboard'>,
  StackNavigationProp<UniversityStackParamList>
>

export function UniversityDashboardScreen() {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const { user } = useAuth()
  const navigation = useNavigation<Nav>()
  const showUniversityTutorial = user != null && user.onboardingTutorialSeen?.university !== true
  const [data, setData] = useState<UniversityDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void getUniversityDashboard()
      .then(setData)
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [])

  const interestedCount = data?.interestedCount ?? 0
  const chatCount = data?.chatCount ?? 0
  const offerSentCount = (data?.offerSentCount ?? 0) + (data?.pendingOffers ?? 0)
  const acceptanceRate = data?.acceptanceRate ?? 0
  const totalInterests = data?.totalInterests ?? 0
  const pipeline = data?.pipeline ?? []
  const topRecs = data?.topRecommendations ?? []

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: c.text }]}>{t('university:dashboard')}</Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={c.primary} /> : null}

        <View style={styles.grid}>
          <MetricCard
            title={t('university:newInterests', 'New interests')}
            value={loading ? '—' : String(interestedCount)}
            sub={!loading ? `${t('university:analyticsTotal', 'Total')}: ${totalInterests}` : undefined}
            onPress={() => navigation.navigate('UniversityPipeline')}
            c={c}
          />
          <MetricCard
            title={t('university:activeChats', 'Active chats')}
            value={loading ? '—' : String(chatCount)}
            onPress={() => navigation.navigate('UniversityChat')}
            c={c}
          />
          <MetricCard
            title={t('university:offersSent', 'Offers sent')}
            value={loading ? '—' : String(offerSentCount)}
            onPress={() => navigation.navigate('UniversityPipeline')}
            c={c}
          />
          <MetricCard
            title={t('university:acceptanceRate', 'Acceptance rate')}
            value={loading ? '—' : `${acceptanceRate}%`}
            onPress={() => navigation.navigate('UniversityAnalytics')}
            c={c}
          />
        </View>

        <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>{t('university:pipelineFunnel', 'Pipeline')}</Text>
          {pipeline.length === 0 && !loading ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>—</Text>
          ) : (
            pipeline.map((p) => (
              <View key={p.status} style={styles.pipelineRow}>
                <Text style={{ color: c.text, fontSize: fontSize.sm }}>{p.status}</Text>
                <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{p._count ?? 0}</Text>
              </View>
            ))
          )}
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('UniversityPipeline')}>
            <Text style={{ color: c.primary }}>{t('university:navPipeline')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>{t('university:topRecommendations')}</Text>
          {topRecs.length === 0 && !loading ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{t('university:noStudents')}</Text>
          ) : (
            topRecs.slice(0, 5).map((r) => {
              const st = r.student
              const sid = st && '_id' in st ? String((st as { _id: unknown })._id) : ''
              const name = getStudentDisplayName(st, 'Student')
              return (
                <View key={r.id} style={styles.recRow}>
                  <Text style={{ color: c.text, flex: 1 }}>{name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>
                    {r.matchScore != null ? `${r.matchScore}%` : ''}
                  </Text>
                  {sid ? (
                    <Pressable onPress={() => navigation.navigate('UniversityStudentProfile', { studentId: sid })}>
                      <Text style={{ color: c.primary, fontSize: fontSize.xs }}>{t('university:viewProfile')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              )
            })
          )}
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('UniversityDiscovery')}>
            <Text style={{ color: c.primary }}>{t('university:navDiscovery')}</Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: c.textMuted }]}>{t('common:home', 'Shortcuts')}</Text>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('UniversityDocuments')}>
          <Text style={{ color: c.text }}>{t('common:documents')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('UniversityFlyers')}>
          <Text style={{ color: c.text }}>{t('university:navFlyers', 'Flyers')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('Scholarships')}>
          <Text style={{ color: c.text }}>{t('university:navScholarships')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('Faculties')}>
          <Text style={{ color: c.text }}>{t('university:navFaculties')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('OfferTemplates')}>
          <Text style={{ color: c.text }}>{t('university:navOfferTemplates')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('UniversityAI')}>
          <Text style={{ color: c.text }}>{t('common:edmissionAi')}</Text>
        </Pressable>
        <Pressable style={[styles.shortcut, { borderColor: c.border }]} onPress={() => navigation.navigate('UniversityOnboarding')}>
          <Text style={{ color: c.text }}>{t('university:onboardingTitle')}</Text>
        </Pressable>
      </ScrollView>
      <TutorialOverlay role="university" visible={showUniversityTutorial} onFinished={() => {}} />
    </SafeAreaView>
  )
}

function MetricCard({
  title,
  value,
  sub,
  onPress,
  c,
}: {
  title: string
  value: string
  sub?: string
  onPress: () => void
  c: ReturnType<typeof useThemeColors>
}) {
  return (
    <Pressable style={[styles.metric, { borderColor: c.border, backgroundColor: c.card }]} onPress={onPress}>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{title}</Text>
      <Text style={{ color: c.text, fontSize: fontSize['2xl'], fontWeight: fontWeight.bold }}>{value}</Text>
      {sub ? <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{sub}</Text> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[3] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
  metric: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderRadius: radii.md, padding: space[3] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  pipelineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingVertical: 6 },
  linkBtn: { marginTop: space[2], alignSelf: 'flex-start' },
  section: { fontSize: fontSize.xs, textTransform: 'uppercase', marginBottom: space[2], marginTop: space[2] },
  shortcut: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
})
