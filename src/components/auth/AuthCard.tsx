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
    borderRadius: radii.lg,
    padding: space[5],
    ...shadowCard(),
  },
})
