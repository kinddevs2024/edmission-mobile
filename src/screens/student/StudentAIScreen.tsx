import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { StackScreenProps } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getAIStatus, sendAIChat, type ChatHistoryItem } from '@/services/ai'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import { AppButton } from '@/components/ui/AppButton'
import { ErrorState } from '@/components/ui/ErrorState'

type Props = StackScreenProps<StudentStackParamList, 'StudentAI'>

type Msg = { role: 'user' | 'assistant'; content: string }

export function StudentAIScreen({ route }: Props) {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const initial = route.params?.initialPrompt?.trim() ?? ''

  const statusQ = useQuery({ queryKey: ['ai-status'], queryFn: getAIStatus, staleTime: 60_000 })

  const [input, setInput] = useState(initial)
  const [messages, setMessages] = useState<Msg[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) setInput(initial)
  }, [initial])

  const onSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    setSending(true)
    const hist: ChatHistoryItem[] = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, { role: 'user', content: text }])
    try {
      const { text: reply } = await sendAIChat({
        message: text,
        history: hist,
      })
      setMessages((m) => [...m, { role: 'assistant', content: reply || t('aiErrorDefault') }])
    } catch (e) {
      setError(e instanceof Error ? e.message : t('aiErrorDefault'))
      setMessages((m) => m.slice(0, -1))
      setInput(text)
    } finally {
      setSending(false)
    }
  }, [input, sending, messages, t])

  const renderItem = useCallback(
    ({ item }: { item: Msg }) => (
      <View
        style={[
          styles.bubble,
          item.role === 'user' ? { alignSelf: 'flex-end', backgroundColor: c.primaryMuted } : { alignSelf: 'flex-start', backgroundColor: c.border + '44' },
        ]}
      >
        <Text style={[styles.bubbleText, { color: c.text }]}>{item.content}</Text>
      </View>
    ),
    [c]
  )

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={[styles.toolbar, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>{t('aiChatTitle')}</Text>
        {statusQ.data ? (
          <Text style={[styles.sub, { color: c.textMuted }]}>
            {statusQ.data.ok ? t('aiPoweredByDeepSeek') : t('aiAssistantUnavailable')}
          </Text>
        ) : null}
      </View>

      {error ? (
        <ErrorState title={t('error')} message={error} retryLabel={t('tryAgain')} onRetry={() => setError(null)} />
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textMuted }]}>{t('aiWelcome')}</Text>
        }
      />

      <View style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.card }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('aiPlaceholder')}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { color: c.text, borderColor: c.border }]}
          multiline
          maxLength={8000}
        />
        {sending ? (
          <ActivityIndicator color={c.primary} style={styles.sendSpinner} />
        ) : (
          <AppButton title={t('send')} onPress={() => void onSend()} />
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: { padding: space[4], borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.xs, marginTop: space[1] },
  list: { padding: space[4], gap: space[2], flexGrow: 1 },
  bubble: { maxWidth: '88%', padding: space[3], borderRadius: radii.lg },
  bubbleText: { fontSize: fontSize.sm, lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: space[10], paddingHorizontal: space[6] },
  composer: { padding: space[3], borderTopWidth: StyleSheet.hairlineWidth, gap: space[2] },
  input: { minHeight: 44, maxHeight: 120, borderWidth: 1, borderRadius: radii.md, padding: space[3], fontSize: fontSize.base },
  sendSpinner: { alignSelf: 'center' },
})
