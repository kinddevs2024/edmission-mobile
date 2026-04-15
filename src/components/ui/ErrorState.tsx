import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Props = {
  title: string
  message?: string
  retryLabel?: string
  onRetry?: () => void
  icon?: ReactNode
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
  icon,
}: Props) {
  const c = useThemeColors()

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: c.danger }]}>{title}</Text>
      {message ? (
        <Text style={[styles.msg, { color: c.textMuted }]}>{message}</Text>
      ) : null}
      {retryLabel && onRetry ? (
        <View style={styles.btn}>
          <AppButton title={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[10],
    paddingHorizontal: space[6],
  },
  icon: { marginBottom: space[3] },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  msg: {
    marginTop: space[2],
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: { marginTop: space[6], alignSelf: 'stretch', maxWidth: 280 },
})
