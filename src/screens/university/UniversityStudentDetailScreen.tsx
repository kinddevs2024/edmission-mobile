import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getUniversityStudentProfile } from '@/services/university'
import { getApiError } from '@/services/auth'
import type { UniversityStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityStackParamList, 'UniversityStudentProfile'>

export function UniversityStudentDetailScreen({ navigation, route }: Props) {
  const { studentId } = route.params
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [p, setP] = useState<Awaited<ReturnType<typeof getUniversityStudentProfile>> | null>(null)

  useEffect(() => {
    void getUniversityStudentProfile(studentId)
      .then(setP)
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }
  if (!p || error) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.danger }}>{error || t('common:somethingWentWrong')}</Text>
      </View>
    )
  }

  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || '—'
  const privateVis = p.profileVisibility === 'private'

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: space[2] }}>
          <Text style={{ color: c.primary }}>{t('common:back')}</Text>
        </Pressable>
        {privateVis ? (
          <Text style={[styles.banner, { backgroundColor: c.warning + '22', color: c.text }]}>
            {t('university:privateProfileBanner')}
          </Text>
        ) : null}
        {p.peerScholarships && p.peerScholarships.length > 0 ? (
          <View style={[styles.peerBox, { borderColor: c.border, backgroundColor: c.card }]}>
            <Text style={[styles.peerTitle, { color: c.text }]}>{t('university:peerScholarshipsSectionTitle')}</Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginBottom: space[2] }}>
              {t('university:peerScholarshipsSectionIntro')}
            </Text>
            {p.peerScholarships.map((row, i) => (
              <Text key={i} style={{ color: c.text, fontSize: fontSize.sm, marginBottom: space[1] }}>
                {t('university:city')}: {row.city?.trim() ? row.city : t('university:peerScholarshipsCityUnknown')} · {t('university:coveragePercent')}:{' '}
                {row.coveragePercent}%
              </Text>
            ))}
          </View>
        ) : null}
        <Text style={[styles.h1, { color: c.text }]}>{privateVis ? t('university:privateStudentPageTitle') : name}</Text>
        {!privateVis && p.email ? <Text style={{ color: c.textMuted }}>{p.email}</Text> : null}
        <Section title={t('university:studentLabel')} c={c}>
          <KV k={t('university:country')} v={p.country} c={c} hide={privateVis} />
          <KV k={t('university:city')} v={p.city} c={c} hide={privateVis} />
          <KV k="GPA" v={p.gpa != null ? String(p.gpa) : undefined} c={c} hide={privateVis} />
        </Section>
        <Section title={t('university:sectionBasic')} c={c}>
          <KV k={t('university:schoolName', 'School')} v={p.schoolName} c={c} hide={privateVis} />
          <KV k={t('university:graduationYear', 'Graduation')} v={p.graduationYear != null ? String(p.graduationYear) : undefined} c={c} hide={privateVis} />
          <KV k="Target degree" v={p.targetDegreeLevel} c={c} hide={privateVis} />
        </Section>
        {p.bio && !privateVis ? (
          <Section title={t('university:description')} c={c}>
            <Text style={{ color: c.text }}>{p.bio}</Text>
          </Section>
        ) : null}
        {(p.skills?.length || p.interests?.length) && !privateVis ? (
          <Section title="Skills & interests" c={c}>
            {p.skills?.length ? <Text style={{ color: c.text }}>{p.skills.join(', ')}</Text> : null}
            {p.interests?.length ? <Text style={{ color: c.textMuted, marginTop: 4 }}>{p.interests.join(', ')}</Text> : null}
          </Section>
        ) : null}
        <Pressable
          style={[styles.btn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('UniversityHome', { screen: 'UniversityChat' })}
        >
          <Text style={{ color: c.onPrimary }}>{t('common:openChat')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ title, children, c }: { title: string; children: ReactNode; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ marginTop: space[4] }}>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: space[1] }}>{title}</Text>
      {children}
    </View>
  )
}

function KV({ k, v, c, hide }: { k: string; v?: string; c: ReturnType<typeof useThemeColors>; hide?: boolean }) {
  if (hide || !v) return null
  return (
    <Text style={{ color: c.text, fontSize: fontSize.sm, marginBottom: 4 }}>
      {k}: {v}
    </Text>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space[4] },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  banner: { padding: space[3], borderRadius: radii.md, marginBottom: space[2] },
  peerBox: { marginBottom: space[3], padding: space[3], borderRadius: radii.md, borderWidth: 1 },
  peerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: space[1] },
  btn: { marginTop: space[6], padding: space[3], borderRadius: radii.md, alignItems: 'center' },
})
