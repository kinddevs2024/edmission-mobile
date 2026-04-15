import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { addTicketReply, createTicket, getMyTickets, getTicket, type Ticket } from '@/services/tickets'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function SupportScreen() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const navigation = useNavigation()
  const route = useRoute()
  const ticketId = (route.params as { id?: string } | undefined)?.id

  const [list, setList] = useState<Ticket[]>([])
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState('')

  const clearTicketParam = () => {
    navigation.setParams({ id: undefined } as never)
  }

  const loadList = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await getMyTickets({ limit: 50 })
      setList(res.data ?? [])
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOne = useCallback(async (id: string) => {
    setError('')
    setLoading(true)
    try {
      const t0 = await getTicket(id)
      setTicket(t0)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ticketId) {
      void loadOne(ticketId)
    } else {
      setTicket(null)
      void loadList()
    }
  }, [ticketId, loadList, loadOne])

  const submitNew = async () => {
    if (!subject.trim() || !message.trim()) {
      setError(t('common:fillSubjectAndMessage'))
      return
    }
    setSending(true)
    setError('')
    try {
      const created = await createTicket(subject.trim(), message.trim())
      setSubject('')
      setMessage('')
      navigation.setParams({ id: created.id } as never)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSending(false)
    }
  }

  const submitReply = async () => {
    if (!ticketId || !reply.trim()) return
    setSending(true)
    setError('')
    try {
      const updated = await addTicketReply(ticketId, reply.trim())
      setReply('')
      if (updated) setTicket(updated)
      else void loadOne(ticketId)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSending(false)
    }
  }

  if (ticketId) {
    if (loading && !ticket) {
      return (
        <View style={[styles.center, { backgroundColor: c.background }]}>
          <ActivityIndicator color={c.primary} />
        </View>
      )
    }
    if (!ticket) {
      return (
        <View style={[styles.center, { backgroundColor: c.background }]}>
          <Text style={{ color: c.textMuted }}>{error || t('common:somethingWentWrong')}</Text>
        </View>
      )
    }
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.detailScroll} keyboardShouldPersistTaps="handled">
          <Pressable style={[styles.backRow, { borderBottomColor: c.border }]} onPress={clearTicketParam}>
            <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('common:backToTickets')}</Text>
          </Pressable>
          <View style={[styles.detailCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.detailTitle, { color: c.text }]}>{ticket.subject}</Text>
            <Text style={[styles.meta, { color: c.textMuted }]}>{ticket.status}</Text>
            <Text style={[styles.body, { color: c.text }]}>{ticket.message}</Text>
          </View>
          <Text style={[styles.h3, { color: c.text }]}>{t('common:supportReplies')}</Text>
          {(ticket.replies ?? []).length === 0 ? (
            <Text style={{ color: c.textMuted, marginBottom: space[2] }}>—</Text>
          ) : (
            (ticket.replies ?? []).map((item, i) => (
              <View key={`r-${i}`} style={[styles.reply, { borderColor: c.border }]}>
                <Text style={[styles.replyMeta, { color: c.textMuted }]}>
                  {item.isStaff ? t('common:supportStaff') : item.role} · {item.createdAt}
                </Text>
                <Text style={{ color: c.text, fontSize: fontSize.sm }}>{item.message}</Text>
              </View>
            ))
          )}
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder={t('common:yourReply')}
            placeholderTextColor={c.textMuted}
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            multiline
          />
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: c.primary }]}
            onPress={() => void submitReply()}
            disabled={sending}
          >
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:sendReply')}</Text>
          </Pressable>
          {error ? <Text style={{ color: c.danger, marginTop: 8 }}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h3, { color: c.text }]}>{t('common:newRequest')}</Text>
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder={t('common:subject')}
        placeholderTextColor={c.textMuted}
        style={[styles.input, { borderColor: c.border, color: c.text }]}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={t('common:describeIssue')}
        placeholderTextColor={c.textMuted}
        style={[styles.input, styles.textArea, { borderColor: c.border, color: c.text }]}
        multiline
      />
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: c.primary }]}
        onPress={() => void submitNew()}
        disabled={sending}
      >
        <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:sendRequest')}</Text>
      </Pressable>

      <Text style={[styles.h3, { color: c.text, marginTop: space[6] }]}>{t('common:myRequests')}</Text>
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          style={styles.listFlex}
          data={list}
          keyExtractor={(x) => x.id}
          ListEmptyComponent={
            <Text style={{ color: c.textMuted, marginTop: 8 }}>{t('common:noTicketsYet')}</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}
              onPress={() => navigation.setParams({ id: item.id } as never)}
            >
              <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
                {item.subject}
              </Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>{item.status}</Text>
            </Pressable>
          )}
        />
      )}
      {error ? <Text style={{ color: c.danger, marginTop: 8 }}>{error}</Text> : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[4] },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h3: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: space[2] },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space[3],
    fontSize: fontSize.sm,
    marginBottom: space[2],
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  primaryBtn: { paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center', marginTop: space[2] },
  row: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space[3],
    marginBottom: space[2],
  },
  rowTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.xs, marginTop: 4 },
  detailScroll: { paddingBottom: space[10] },
  backRow: { paddingVertical: space[3], borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: space[2] },
  detailCard: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[4] },
  detailTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  body: { fontSize: fontSize.sm, marginTop: space[2] },
  reply: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space[2] },
  replyMeta: { fontSize: fontSize.xs, marginBottom: 4 },
})
