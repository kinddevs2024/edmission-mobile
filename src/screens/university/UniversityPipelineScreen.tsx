import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getPipeline, updateInterestStatus, type PipelineItem } from '@/services/university'
import type { PipelineStage } from '@/types/university'
import { getApiError } from '@/services/auth'
import { getStudentDisplayName } from '@/utils/studentDisplay'
import type { UniversityStackParamList, UniversityTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<UniversityTabParamList, 'UniversityPipeline'>,
  StackNavigationProp<UniversityStackParamList>
>

const PIPELINE_STAGES: PipelineStage[] = [
  'interested',
  'contacted',
  'evaluating',
  'offer_sent',
  'accepted',
  'rejected',
]

const STAGE_TO_STATUS: Record<
  PipelineStage,
  'interested' | 'under_review' | 'chat_opened' | 'offer_sent' | 'accepted' | 'rejected'
> = {
  interested: 'interested',
  contacted: 'chat_opened',
  evaluating: 'under_review',
  offer_sent: 'offer_sent',
  accepted: 'accepted',
  rejected: 'rejected',
}

const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  interested: 'interested',
  under_review: 'evaluating',
  chat_opened: 'contacted',
  offer_sent: 'offer_sent',
  accepted: 'accepted',
  rejected: 'rejected',
}

const OBJECT_ID_HEX_RE = /^[a-fA-F0-9]{24}$/

function normalizeMongoId(value: unknown): string | null {
  if (typeof value === 'string') {
    const s = value.trim()
    return OBJECT_ID_HEX_RE.test(s) ? s : null
  }
  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid: unknown }).$oid
    if (typeof oid === 'string' && OBJECT_ID_HEX_RE.test(oid.trim())) return oid.trim()
  }
  return null
}

function pipelineStudentProfileId(item: PipelineItem): string {
  const explicit = item.studentProfileId?.trim()
  if (explicit && OBJECT_ID_HEX_RE.test(explicit)) return explicit
  const fromStudent = item.student ? normalizeMongoId(item.student._id) : null
  if (fromStudent) return fromStudent
  const fallback = item.id?.trim()
  if (fallback && OBJECT_ID_HEX_RE.test(fallback)) return fallback
  return ''
}

type Row = {
  applicationId: string
  studentId: string
  name: string
  stage: PipelineStage
}

function mapItem(item: PipelineItem): Row {
  const st = item.student
  const studentId = pipelineStudentProfileId(item)
  return {
    applicationId: item.id,
    studentId,
    name: getStudentDisplayName(st, 'Student'),
    stage: STATUS_TO_STAGE[item.status] ?? 'interested',
  }
}

export function UniversityPipelineScreen() {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<PipelineStage | 'all'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const items = await getPipeline()
      setRows(items.map(mapItem))
    } catch (e) {
      setError(getApiError(e).message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.stage === filter)),
    [rows, filter]
  )

  const advance = async (applicationId: string, next: PipelineStage) => {
    const status = STAGE_TO_STATUS[next]
    if (!status || status === 'interested') return
    setUpdating(applicationId)
    try {
      await updateInterestStatus(applicationId, status)
      await load()
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setUpdating(null)
    }
  }

  const stageLabel = (s: PipelineStage) => {
    switch (s) {
      case 'interested':
        return t('university:pipelineInterested')
      case 'contacted':
        return t('university:pipelineContacted')
      case 'evaluating':
        return t('university:pipelineEvaluating')
      case 'offer_sent':
        return t('university:pipelineOfferSent')
      case 'accepted':
        return t('university:pipelineAccepted')
      case 'rejected':
        return t('university:pipelineRejected')
      default:
        return s
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('university:navPipeline')}</Text>
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space[2] }}>
        {(['all' as const, ...PIPELINE_STAGES] as const).map((item) => {
          const active = filter === item
          return (
            <Pressable
              key={item}
              style={[
                styles.chip,
                { borderColor: c.border, backgroundColor: active ? c.primaryMuted : c.card },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={{ color: c.text, fontSize: fontSize.xs }}>
                {item === 'all' ? t('university:allStudents', 'All') : stageLabel(item)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={c.primary} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.applicationId}
          ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('university:noStudents')}</Text>}
          renderItem={({ item }) => {
            const idx = PIPELINE_STAGES.indexOf(item.stage)
            const nextStage = idx >= 0 && idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null
            return (
              <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
                <Pressable onPress={() => navigation.navigate('UniversityStudentProfile', { studentId: item.studentId })}>
                  <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{stageLabel(item.stage)}</Text>
                </Pressable>
                {nextStage && nextStage !== 'rejected' ? (
                  <Pressable
                    style={[styles.miniBtn, { borderColor: c.primary }]}
                    disabled={updating === item.applicationId}
                    onPress={() => void advance(item.applicationId, nextStage)}
                  >
                    <Text style={{ color: c.primary, fontSize: fontSize.xs }}>
                      → {stageLabel(nextStage)}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }}
          contentContainerStyle={{ gap: space[2], paddingBottom: space[10] }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[2] },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1, marginRight: space[2] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3] },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  miniBtn: { marginTop: space[2], alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
})
