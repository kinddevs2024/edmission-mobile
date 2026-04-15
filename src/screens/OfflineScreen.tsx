import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeColors } from '@/theme/useThemeColors'

type Props = {
  onRetry: () => Promise<unknown>
}

export function OfflineScreen({ onRetry }: Props) {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = useState(false)

  return (
    <View style={[styles.wrap, { backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <Text style={[styles.title, { color: c.text }]}>{t('offline.title')}</Text>
      <Text style={[styles.desc, { color: c.textMuted }]}>{t('offline.description')}</Text>
      <Pressable
        style={[styles.btn, { backgroundColor: c.primary }, busy && styles.btnDisabled]}
        disabled={busy}
        onPress={async () => {
          setBusy(true)
          try {
            await onRetry()
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? (
          <ActivityIndicator color={c.onPrimary} />
        ) : (
          <Text style={[styles.btnTxt, { color: c.onPrimary }]}>{t('offline.retry')}</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.85 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
})
