import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { radii, shadowCard, space, useThemeColors } from '@/theme'

type Props = {
  children: ReactNode
  style?: ViewStyle
  /** Pressable card (e.g. list row) */
  onPress?: () => void
  /** No shadow (flat surface) */
  flat?: boolean
}

export function AppCard({ children, style, onPress, flat }: Props) {
  const c = useThemeColors()
  const baseStyle: ViewStyle = {
    backgroundColor: c.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: space[4],
    ...(!flat ? shadowCard() : {}),
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    )
  }

  return <View style={[baseStyle, style]}>{children}</View>
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
})
