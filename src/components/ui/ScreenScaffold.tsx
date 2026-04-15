import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Props = {
  title?: string
  children: ReactNode
  /** Wrap body in ScrollView (default true) */
  scroll?: boolean
  contentContainerStyle?: ViewStyle
  /** Extra bottom padding for tab bar */
  bottomInset?: number
  /** Pull-to-refresh support for scroll screens */
  refreshing?: boolean
  onRefresh?: () => void
}

export function ScreenScaffold({
  title,
  children,
  scroll = true,
  contentContainerStyle,
  bottomInset = 0,
  refreshing = false,
  onRefresh,
}: Props) {
  const c = useThemeColors()
  const paddingBottom = space[6] + bottomInset

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom }, contentContainerStyle]}>
      {children}
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {title ? (
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        ) : null}
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space[3.5],
    paddingTop: space[1.5],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    paddingHorizontal: space[3.5],
    paddingTop: space[1.5],
    paddingBottom: space[2],
  },
})
