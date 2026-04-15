import { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { logout } from '@/services/auth'
import { getApplications, getOffers, getRecommendedUniversitiesPreview, getStudentProfile } from '@/services/student'
import { getMyDocuments } from '@/services/studentDocuments'
import type { StudentStackParamList } from '@/navigation/types'
import type { UniversityListItem } from '@/types/university'
import type { Application } from '@/types/student'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { getImageUrl } from '@/utils/imageUrl'
import { AppCard } from '@/components/ui/AppCard'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'
import { TutorialOverlay } from '@/components/TutorialOverlay'
import { useAuth } from '@/hooks/useAuth'

type Props = { navigation: StackNavigationProp<StudentStackParamList> }

export function StudentDashboardScreen({ navigation }: Props) {
  const { t } = useTranslation(['student', 'common'])
  const c = useThemeColors()
  const { user } = useAuth()
  const showStudentTutorial = user != null && user.onboardingTutorialSeen?.student !== true

  const profileQ = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile })
  const appsQ = useQuery({ queryKey: ['student-applications', 'dashboard'], queryFn: () => getApplications({ limit: 100 }) })
  const offersQ = useQuery({ queryKey: ['student-offers', 'dashboard'], queryFn: () => getOffers({ limit: 100 }) })
  const docsQ = useQuery({ queryKey: ['student-documents'], queryFn: getMyDocuments })
  const recsQ = useQuery({
    queryKey: ['student-recommendations-preview'],
    queryFn: () => getRecommendedUniversitiesPreview(5),
  })

  const applications = appsQ.data?.data ?? []
  const offers = offersQ.data?.data ?? []
  const profilePercent = profileQ.data?.portfolioCompletionPercent ?? 0
  const minimalComplete = profileQ.data?.minimalPortfolioComplete ?? false
  const docCount = docsQ.data?.length ?? 0

  const activeApplications = useMemo(
    () => applications.filter((a) => !['rejected', 'accepted'].includes(a.status)),
    [applications]
  )
  const acceptedCount = useMemo(() => applications.filter((a) => a.status === 'accepted').length, [applications])

  const onboardingSteps = useMemo(
    () => [
      { label: t('student:stepMinimalProfile'), done: minimalComplete, onPress: () => navigation.navigate('StudentHome', { path: '/student/profile' }) },
      { label: t('student:stepUploadDocument'), done: docCount > 0, onPress: () => navigation.navigate('StudentHome', { path: '/student/documents' }) },
    ],
    [t, minimalComplete, docCount, navigation]
  )
  const onboardingDone = onboardingSteps.every((s) => s.done)

  const goExplore = useCallback(() => navigation.navigate('StudentHome', { path: '/student/universities' }), [navigation])
  const goApps = useCallback(() => navigation.navigate('StudentHome', { path: '/student/applications' }), [navigation])
  const goOffersStack = useCallback(() => navigation.navigate('StudentHome', { path: '/student/offers' }), [navigation])
  const goChat = useCallback(() => navigation.navigate('StudentHome', { path: '/student/chat' }), [navigation])
  const goProfile = useCallback(() => navigation.navigate('StudentHome', { path: '/student/profile' }), [navigation])

  const loadingDash = appsQ.isPending || offersQ.isPending || profileQ.isPending || docsQ.isPending

  return (
    <ScreenScaffold scroll title={t('student:studentDashboardTitle')} bottomInset={space[2]}>
      {loadingDash ? (
        <ActivityIndicator size="large" color={c.primary} style={styles.loader} />
      ) : null}

      {!onboardingDone && (
        <AppCard flat style={styles.block}>
          <Text style={[styles.cardTitle, { color: c.text }]}>{t('student:getStarted')}</Text>
          <Text style={[styles.hint, { color: c.textMuted }]}>{t('student:getStartedHint')}</Text>
          {onboardingSteps.map((step) => (
            <Pressable key={step.label} style={styles.stepRow} onPress={step.onPress}>
              <Ionicons
                name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={step.done ? c.success : c.textMuted}
              />
              <Text style={[styles.stepLink, { color: c.primary }]}>{step.label}</Text>
            </Pressable>
          ))}
        </AppCard>
      )}

      <View style={styles.grid}>
        <Pressable onPress={goProfile}>
          <AppCard flat style={styles.statCard}>
            <Text style={[styles.statLabel, { color: c.text }]}>{t('student:profileCompletion')}</Text>
            <View style={[styles.progressBg, { backgroundColor: c.border }]}>
              <View style={[styles.progressFg, { width: `${Math.min(100, profilePercent)}%`, backgroundColor: c.primary }]} />
            </View>
            <Text style={[styles.statValue, { color: c.primary }]}>{Math.round(profilePercent)}%</Text>
          </AppCard>
        </Pressable>
        <Pressable onPress={goApps}>
          <AppCard flat style={styles.statCard}>
            <Text style={[styles.statLabel, { color: c.text }]}>{t('student:activeApplications', 'Active applications')}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{activeApplications.length}</Text>
          </AppCard>
        </Pressable>
        <Pressable onPress={goOffersStack}>
          <AppCard flat style={styles.statCard}>
            <Text style={[styles.statLabel, { color: c.text }]}>{t('student:offers')}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{offers.length}</Text>
          </AppCard>
        </Pressable>
        <Pressable onPress={goApps}>
          <AppCard flat style={styles.statCard}>
            <Text style={[styles.statLabel, { color: c.text }]}>{t('student:accepted')}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{acceptedCount}</Text>
          </AppCard>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>{t('student:recommendedUniversities')}</Text>
      {recsQ.isPending ? (
        <ActivityIndicator color={c.primary} style={styles.loaderSm} />
      ) : (recsQ.data?.length ?? 0) > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
          {(recsQ.data ?? []).map((u) => (
            <RecommendationCard
              key={u.id}
              university={u}
              onPress={() => navigation.navigate('StudentHome', { path: `/student/universities/${u.id}` })}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('student:completeProfileForRecs')}</Text>
      )}

      {(activeApplications.length > 0 || offers.length > 0) && (
        <View style={styles.dual}>
          {activeApplications.length > 0 ? (
            <AppCard flat style={styles.block}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('student:activeApplications', 'Active applications')}</Text>
              {activeApplications.slice(0, 5).map((a: Application) => (
                <View key={a.id} style={styles.listRow}>
                  <Text style={[styles.listMain, { color: c.text }]} numberOfLines={1}>
                    {a.universityName ?? a.universityId}
                  </Text>
                  <Text style={[styles.listMeta, { color: c.textMuted }]} numberOfLines={1}>
                    {a.status}
                  </Text>
                </View>
              ))}
              <Pressable onPress={goApps} style={styles.ghostBtn}>
                <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('student:allApplications')}</Text>
              </Pressable>
            </AppCard>
          ) : null}
          {offers.length > 0 ? (
            <AppCard flat style={styles.block}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('student:recentOffers')}</Text>
              {offers.slice(0, 3).map((o) => (
                <View key={o.id} style={styles.listRow}>
                  <Text style={[styles.listMain, { color: c.text }]} numberOfLines={1}>
                    {o.universityName ?? o.universityId}
                  </Text>
                </View>
              ))}
              <Pressable onPress={goOffersStack} style={styles.ghostBtn}>
                <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('student:allOffers')}</Text>
              </Pressable>
            </AppCard>
          ) : null}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={goExplore}>
          <Text style={[styles.primaryBtnText, { color: c.onPrimary }]}>{t('student:exploreUniversities')}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, { borderColor: c.border }]} onPress={goApps}>
          <Text style={[styles.secondaryBtnText, { color: c.text }]}>{t('student:myApplications')}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, { borderColor: c.border }]} onPress={goChat}>
          <Text style={[styles.secondaryBtnText, { color: c.text }]}>{t('student:chats')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          void logout()
        }}
        style={styles.logout}
      >
        <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:logout', 'Log out')}</Text>
      </Pressable>
      <TutorialOverlay role="student" visible={showStudentTutorial} onFinished={() => {}} />
    </ScreenScaffold>
  )
}

function RecommendationCard({
  university: u,
  onPress,
}: {
  university: UniversityListItem
  onPress: () => void
}) {
  const c = useThemeColors()
  const uri = u.logo ? getImageUrl(u.logo) : ''
  return (
    <Pressable onPress={onPress} style={[styles.recCard, { borderColor: c.border, backgroundColor: c.card }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.recLogo} />
      ) : (
        <View style={[styles.recLogo, styles.recLogoPh, { backgroundColor: c.primaryMuted }]}>
          <Text style={{ color: c.primary, fontWeight: fontWeight.bold }}>{u.name.slice(0, 1)}</Text>
        </View>
      )}
      <Text style={[styles.recName, { color: c.text }]} numberOfLines={2}>
        {u.name}
      </Text>
      {u.matchScore != null ? (
        <Text style={{ color: c.primary, fontSize: fontSize.xs }}>{Math.round(u.matchScore)}%</Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  loader: { marginVertical: space[6] },
  loaderSm: { marginVertical: space[4] },
  block: { marginBottom: space[4] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  hint: { fontSize: fontSize.sm, marginBottom: space[2] },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[2] },
  stepLink: { fontSize: fontSize.sm, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginBottom: space[6] },
  statCard: { width: 158, minHeight: 100, marginBottom: 0 },
  statLabel: { fontSize: fontSize.xs, marginBottom: space[2] },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  progressBg: { height: 8, borderRadius: radii.full, overflow: 'hidden', marginBottom: space[2] },
  progressFg: { height: '100%', borderRadius: radii.full },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: space[3] },
  recRow: { gap: space[3], paddingBottom: space[4] },
  recCard: { width: 160, padding: space[3], borderRadius: radii.lg, borderWidth: 1 },
  recLogo: { width: 48, height: 48, borderRadius: radii.sm, marginBottom: space[2] },
  recLogoPh: { alignItems: 'center', justifyContent: 'center' },
  recName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dual: { gap: space[4], marginBottom: space[4] },
  listRow: { marginTop: space[2], paddingVertical: space[1] },
  listMain: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  listMeta: { fontSize: fontSize.xs, marginTop: 2 },
  ghostBtn: { marginTop: space[3], alignSelf: 'flex-start' },
  actions: { gap: space[2], marginTop: space[2] },
  primaryBtn: { paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center' },
  primaryBtnText: { fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  secondaryBtn: {
    paddingVertical: space[3],
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: { fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  logout: { marginTop: space[8], marginBottom: space[6], alignItems: 'center' },
})
