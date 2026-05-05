import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { radii, shadowCard, space, useThemeColors } from '@/theme'

export function AuthCard({ children }: { children: ReactNode }) {
  const c = useThemeColors()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: c.primary }]} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space[4],
    overflow: 'hidden',
    ...shadowCard(),
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
})
