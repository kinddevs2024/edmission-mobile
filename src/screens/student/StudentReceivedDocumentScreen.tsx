import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  acceptIssuedDocument,
  declineIssuedDocument,
  getIssuedDocument,
  postponeIssuedDocument,
  viewIssuedDocument,
} from '@/services/documentsIssued'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import { formatDate } from '@/utils/formatDate'
import { AppButton } from '@/components/ui/AppButton'
import { AppCard } from '@/components/ui/AppCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'

type Props = {
  navigation: StackNavigationProp<StudentStackParamList>
  route: { params: { id: string } }
}

function renderPayload(payload: Record<string, unknown>): { k: string; v: string }[] {
  const out: { k: string; v: string }[] = []
  for (const [k, val] of Object.entries(payload)) {
    if (val == null) continue
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val)
    out.push({ k, v: s.length > 280 ? `${s.slice(0, 280)}…` : s })
  }
  return out
}

export function StudentReceivedDocumentScreen({ navigation, route }: Props) {
  const { id } = route.params
  const { t, i18n } = useTranslation(['documents', 'common'])
  const c = useThemeColors()
  const qc = useQueryClient()
  const lastAutoView = useRef<string | null>(null)

  const query = useQuery({
    queryKey: ['issued-document', id],
    queryFn: () => getIssuedDocument(id),
  })

  const [doc, setDoc] = useState(query.data)

  useEffect(() => {
    if (query.data) setDoc(query.data)
  }, [query.data])

  useEffect(() => {
    if (!query.data) return
    const d = query.data
    const shouldMark = d.status === 'sent' && !d.viewedAt && lastAutoView.current !== id
    if (!shouldMark) return
    lastAutoView.current = id
    viewIssuedDocument(id)
      .then((next) => {
        setDoc(next)
        void qc.invalidateQueries({ queryKey: ['issued-document', id] })
      })
      .catch(() => {})
  }, [id, query.data, qc])

  const acceptM = useMutation({
    mutationFn: () => acceptIssuedDocument(id),
    onSuccess: (d) => {
      setDoc(d)
      void qc.invalidateQueries({ queryKey: ['issued-documents-student'] })
    },
  })
  const declineM = useMutation({
    mutationFn: () => declineIssuedDocument(id),
    onSuccess: (d) => {
      setDoc(d)
      void qc.invalidateQueries({ queryKey: ['issued-documents-student'] })
    },
  })
  const postponeM = useMutation({
    mutationFn: (days: 3 | 7 | 14) => postponeIssuedDocument(id, days),
    onSuccess: (d) => {
      setDoc(d)
      void qc.invalidateQueries({ queryKey: ['issued-documents-student'] })
    },
  })

  const d = doc ?? query.data
  const canDecide = d && ['sent', 'viewed', 'postponed'].includes(d.status)
  const lines = d?.renderedPayload ? renderPayload(d.renderedPayload) : []

  if (query.isError) {
    return (
      <ScreenScaffold title={t('documents:common.document')}>
        <ErrorState
          title={t('common:error')}
          retryLabel={t('common:tryAgain')}
          onRetry={() => void query.refetch()}
        />
        <AppButton title={t('documents:studentDocument.backToOffers')} onPress={() => navigation.navigate('StudentHome', { path: '/student/offers' })} />
      </ScreenScaffold>
    )
  }

  if (query.isPending || !d) {
    return (
      <ScreenScaffold title={t('documents:common.document')}>
        <Text style={{ color: c.textMuted }}>{t('common:loading')}</Text>
      </ScreenScaffold>
    )
  }

  return (
    <ScreenScaffold title={d.title ?? t('documents:common.document')} bottomInset={space[2]}>
      <AppCard flat style={styles.block}>
        <Text style={[styles.uni, { color: c.text }]}>
          {d.university?.name ?? t('documents:common.university')}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('documents:studentDocument.deadline')}:{' '}
          {d.expiresAt ? formatDate(d.expiresAt, i18n.language) : t('documents:summary.openEnded')}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('common:status')}: {d.status}
        </Text>
        {d.universityMessage ? (
          <Text style={[styles.msg, { color: c.text }]}>{d.universityMessage}</Text>
        ) : null}
      </AppCard>

      <Text style={[styles.h2, { color: c.text }]}>{t('documents:summary.heading')}</Text>
      <ScrollView style={styles.payload}>
        {lines.map((row) => (
          <View key={row.k} style={styles.payloadRow}>
            <Text style={[styles.pk, { color: c.textMuted }]}>{row.k}</Text>
            <Text style={[styles.pv, { color: c.text }]}>{row.v}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.note, { color: c.textMuted }]}>
        Visual canvas preview: WebView or simplified native UI (later phase).
      </Text>

      {canDecide ? (
        <View style={styles.actions}>
          <AppButton
            title={t('documents:decisionPanel.accept')}
            loading={acceptM.isPending}
            onPress={() => acceptM.mutate()}
          />
          <AppButton
            title={t('documents:decisionPanel.decline')}
            variant="secondary"
            loading={declineM.isPending}
            onPress={() => declineM.mutate()}
          />
          <AppButton
            title={t('documents:decisionPanel.postponeDays_other', { count: 7 })}
            variant="ghost"
            loading={postponeM.isPending}
            onPress={() => postponeM.mutate(7)}
          />
        </View>
      ) : (
        <Text style={{ color: c.textMuted, marginTop: space[4] }}>
          {t('documents:studentDocument.closedForFurtherActions')}
        </Text>
      )}

      <AppButton title={t('documents:studentDocument.backToOffers')} variant="ghost" onPress={() => navigation.navigate('StudentHome', { path: '/student/offers' })} />
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  block: { marginBottom: space[4] },
  uni: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm, marginTop: space[1] },
  msg: { marginTop: space[3], fontSize: fontSize.sm },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  payload: { maxHeight: 320, marginBottom: space[4] },
  payloadRow: { marginBottom: space[3] },
  pk: { fontSize: fontSize.xs, marginBottom: space[1] },
  pv: { fontSize: fontSize.sm },
  note: { fontSize: fontSize.xs, marginBottom: space[4] },
  actions: { gap: space[2], marginBottom: space[6] },
})
