import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getChatMessages, sendAdminChatMessage, type AdminChatMessage } from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import type { AdminStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<AdminStackParamList, 'AdminChatDetail'>

export function AdminChatDetailScreen({ route }: Props) {
  const { chatId } = route.params
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getChatMessages(chatId, { limit: 100 })
      .then((res) => setMessages([...(res.messages ?? [])].reverse()))
      .catch((e) => setError(getApiError(e).message))
  }, [chatId])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const send = async () => {
    const v = text.trim()
    if (!v || sending) return
    setSending(true)
    try {
      await sendAdminChatMessage(chatId, v)
      setText('')
      await load()
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('admin:noMessages')}</Text>}
            renderItem={({ item }) => (
              <View style={[styles.bubble, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{item.createdAt?.slice(0, 19)}</Text>
                <Text style={{ color: c.text, marginTop: 4 }}>{item.message}</Text>
              </View>
            )}
          />
        )}
        <View style={[styles.inputRow, { borderColor: c.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('admin:mobileChatPlaceholder')}
            placeholderTextColor={c.textMuted}
            style={[styles.input, { color: c.text }]}
            multiline
          />
          <Pressable
            style={[styles.send, { backgroundColor: c.primary, opacity: sending ? 0.6 : 1 }]}
            onPress={() => void send()}
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
  bubble: { padding: space[3], borderRadius: radii.md, borderWidth: 1, marginBottom: space[2] },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2], paddingTop: space[2], borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, fontSize: fontSize.sm },
  send: { paddingHorizontal: space[3], paddingVertical: space[3], borderRadius: radii.md },
})
