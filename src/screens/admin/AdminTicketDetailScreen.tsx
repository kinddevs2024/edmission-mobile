import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { addAdminTicketReply, getAdminTicket, updateAdminTicketStatus, type AdminTicket } from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import type { AdminStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<AdminStackParamList, 'AdminTicketDetail'>

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const

export function AdminTicketDetailScreen({ route }: Props) {
  const { ticketId } = route.params
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [ticket, setTicket] = useState<AdminTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getAdminTicket(ticketId)
      .then(setTicket)
      .catch((e) => setError(getApiError(e).message))
  }, [ticketId])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const setStatus = (status: string) => {
    void updateAdminTicketStatus(ticketId, status)
      .then(() => load())
      .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
  }

  const sendReply = async () => {
    const v = reply.trim()
    if (!v || sending) return
    setSending(true)
    try {
      await addAdminTicketReply(ticketId, v)
      setReply('')
      await load()
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setSending(false)
    }
  }

  if (loading || !ticket) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.subject, { color: c.text }]}>{ticket.subject}</Text>
          <Text style={{ color: c.textMuted, marginBottom: space[2] }}>
            {ticket.userEmail} · {ticket.status}
          </Text>
          <Text style={{ color: c.text, marginBottom: space[3] }}>{ticket.message}</Text>

          <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: space[1] }}>
            {t('admin:mobileTicketStatus')}
          </Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.statusChip,
                  {
                    borderColor: ticket.status === s ? c.primary : c.border,
                    backgroundColor: ticket.status === s ? c.primaryMuted : c.card,
                  },
                ]}
              >
                <Text style={{ color: c.text, fontSize: fontSize.xs }}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.h2, { color: c.text }]}>{t('admin:mobileTicketThread')}</Text>
          {(ticket.replies ?? []).map((r, i) => (
            <View key={`${r.createdAt}-${i}`} style={[styles.reply, { borderColor: c.border }]}>
              <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>
                {r.role} · {r.createdAt?.slice(0, 19)}
              </Text>
              <Text style={{ color: c.text, marginTop: 4 }}>{r.message}</Text>
            </View>
          ))}
        </ScrollView>

        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        <View style={[styles.inputRow, { borderColor: c.border }]}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder={t('admin:mobileTicketReplyPlaceholder')}
            placeholderTextColor={c.textMuted}
            style={[styles.input, { color: c.text }]}
            multiline
          />
          <Pressable
            style={[styles.send, { backgroundColor: c.primary, opacity: sending ? 0.6 : 1 }]}
            onPress={() => void sendReply()}
            disabled={sending}
          >
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:send')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: space[6] },
  subject: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: space[2] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: space[4], marginBottom: space[2] },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space[4] },
  statusChip: { paddingHorizontal: space[2], paddingVertical: 6, borderRadius: radii.md, borderWidth: 1 },
  reply: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2], paddingVertical: space[2], borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 100, fontSize: fontSize.sm },
  send: { paddingHorizontal: space[3], paddingVertical: space[3], borderRadius: radii.md },
})
