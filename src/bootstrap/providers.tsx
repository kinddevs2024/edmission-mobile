import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Platform, StyleSheet, View, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { onlineManager } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { applyWebViewportStyles } from '@/bootstrap/webViewport'
import { queryClient } from '@/bootstrap/queryClient'
import { shouldPersistQuery } from '@/bootstrap/queryPersist'
import { useAuthHydration } from '@/hooks/useAuthHydration'
import { initI18n, default as i18n } from '@/i18n'
import { AppRoot, AppLoading } from '@/navigation/AppRoot'
import { trackNavigationState } from '@/navigation/navigationAnalytics'
import { PushRegistration } from '@/bootstrap/PushRegistration'
import { useAuthStore } from '@/store/authStore'

const RQ_PERSIST_KEY = 'edmission-rq-cache'
const RQ_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function OnlineSyncBridge() {
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false
      onlineManager.setOnline(online)
      if (online) {
        void queryClient.resumePausedMutations()
        void queryClient.invalidateQueries()
      }
    })
  }, [])

  return null
}

function PersistingApp({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const persister = useMemo(
    () =>
      createAsyncStoragePersister({
        storage: AsyncStorage,
        key: RQ_PERSIST_KEY,
      }),
    []
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: RQ_MAX_AGE,
        buster: userId,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
        },
      }}
    >
      <OnlineSyncBridge />
      {children}
    </PersistQueryClientProvider>
  )
}

export function AppProviders() {
  const [i18nReady, setI18nReady] = useState(false)
  const hydrated = useAuthHydration()
  const scheme = useColorScheme()
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true))
  }, [])

  useEffect(() => {
    applyWebViewportStyles()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {!i18nReady || !hydrated ? (
          <AppLoading />
        ) : (
          <PersistingApp>
            <I18nextProvider i18n={i18n}>
              <PushRegistration />
              <View style={shell.nav}>
                <NavigationContainer
                  theme={navigationTheme}
                  onStateChange={(state) => {
                    trackNavigationState(state ?? undefined)
                  }}
                >
                  <AppRoot />
                </NavigationContainer>
              </View>
            </I18nextProvider>
          </PersistingApp>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: Platform.select({
    web: { flex: 1, height: '100%', minHeight: '100%' },
    default: { flex: 1 },
  }),
})

const shell = StyleSheet.create({
  nav: Platform.select({
    web: { flex: 1, minHeight: '100%', height: '100%', alignSelf: 'stretch' },
    default: { flex: 1 },
  }),
})
