import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: Props) {
  const c = useThemeColors()

  return (
    <View style={styles.wrap} accessibilityRole="text">
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { color: c.textMuted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.btn}>
          <AppButton title={actionLabel} onPress={onAction} />
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
  desc: {
    marginTop: space[2],
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: { marginTop: space[6], alignSelf: 'stretch', maxWidth: 280 },
})
