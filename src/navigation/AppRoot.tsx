import type { ReactNode } from 'react'
import { Image, Platform, Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { AuthNavigator } from '@/navigation/AuthNavigator'
import { StudentNavigator } from '@/navigation/StudentNavigator'
import { UniversityNavigator } from '@/navigation/UniversityNavigator'
import { SchoolNavigator } from '@/navigation/SchoolNavigator'
import { AdminNavigator } from '@/navigation/AdminNavigator'
import { MaintenanceScreen } from '@/screens/MaintenanceScreen'
import { SetPasswordScreen } from '@/screens/auth/SetPasswordScreen'
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner'
import { useAppStatusStore } from '@/store/appStatusStore'
import { useThemeColors } from '@/theme'
import type { User } from '@/types/user'

function needsPasswordGate(user: User | null | undefined) {
  return Boolean(user?.mustChangePassword || user?.mustSetLocalPassword)
}

export function AppRoot() {
  const c = useThemeColors()
  const insets = useSafeAreaInsets()
  const { isAuthenticated, user } = useAuth()
  const maintenance = useAppStatusStore((s) => s.maintenance)

  if (maintenance) {
    return (
      <View
        style={[
          styles.safe,
          Platform.OS === 'web' && styles.safeWeb,
          { backgroundColor: c.background },
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <MaintenanceScreen />
      </View>
    )
  }

  let body: ReactNode
  if (!isAuthenticated) {
    body = <AuthNavigator />
  } else if (needsPasswordGate(user)) {
    body = <SetPasswordScreen />
  } else if (user?.role === 'student') {
    body = <StudentNavigator />
  } else if (user?.role === 'university') {
    body = <UniversityNavigator />
  } else if (user?.role === 'admin') {
    body = <AdminNavigator />
  } else if (user?.role === 'school_counsellor') {
    body = <SchoolNavigator />
  } else {
    body = <AuthNavigator />
  }

  return (
    <View
      style={[
        styles.safe,
        Platform.OS === 'web' && styles.safeWeb,
        { backgroundColor: c.background },
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {body}
      <NetworkStatusBanner />
    </View>
  )
}

export function AppLoading() {
  const c = useThemeColors()
  return (
    <View style={[styles.loading, { backgroundColor: c.background }]}>
      <Image
        source={require('../../assets/icon-square.png')}
        resizeMode="contain"
        style={styles.loadingLogo}
      />
      <Text style={[styles.loadingTitle, { color: c.text }]}>Edmission</Text>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  /** RN-web: stretch the navigation tree to the full document height so WebView/iframe can grow. */
  safeWeb: { minHeight: '100%', height: '100%', alignSelf: 'stretch' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingLogo: { width: 76, height: 76, borderRadius: 18 },
  loadingTitle: { fontSize: 24, fontWeight: '800' },
})
