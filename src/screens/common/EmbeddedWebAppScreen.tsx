import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { WebView, WebViewNavigation } from 'react-native-webview'
import { useTranslation } from 'react-i18next'
import { PlatformWebView } from '@/components/web/PlatformWebView'
import { getWebAppOrigin } from '@/config/webApp'
import { useAuth } from '@/hooks/useAuth'
import { getStoredRefreshToken } from '@/services/authPersistence'
import { createMobileWebAuthSession, logoutLocally } from '@/services/auth'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

export interface EmbeddedWebAppScreenProps {
  /** Path on the SPA, e.g. `/student/dashboard` */
  webPath: string
  onCloseRequest?: () => void
}

function safeWebPath(raw: string): string {
  const value = raw.startsWith('/') ? raw : `/${raw}`
  if (value.startsWith('//')) return '/student/dashboard'
  if (value === '/login' || value.startsWith('/login?')) return '/student/dashboard'
  return value
}

function normalizePathname(pathname: string): string {
  const path = pathname.replace(/\/+$/, '')
  return path || '/'
}

function isWebsiteAuthPath(path: string): boolean {
  return (
    path === '/login' ||
    path === '/login-phone' ||
    path === '/sing-in' ||
    path === '/register' ||
    path === '/register-phone'
  )
}

function buildNativeShellScript(authPayload: {
  userJson: string
  accessToken: string
  refreshToken: string | null
} | null): string {
  const authLines = authPayload
    ? `
      try {
        localStorage.setItem('auth_user', ${JSON.stringify(authPayload.userJson)});
        localStorage.setItem('auth_accessToken', ${JSON.stringify(authPayload.accessToken)});
        ${
          authPayload.refreshToken
            ? `localStorage.setItem('auth_refreshToken', ${JSON.stringify(authPayload.refreshToken)});`
            : "localStorage.removeItem('auth_refreshToken');"
        }
        localStorage.setItem('auth_lastActivityAt', String(Date.now()));
      } catch (e) {}
    `
    : ''

  return `
    (function() {
      try {
        var post = function(type, data) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, data || {})));
            }
          } catch (e) {}
        };
        var postNav = function() {
          post('edmission.nav', {
            url: String(location.href || ''),
            canGoBack: history.length > 1
          });
        };
        if (!window.__edmissionNativeUrlBridge) {
          window.__edmissionNativeUrlBridge = true;
          var pushState = history.pushState;
          var replaceState = history.replaceState;
          history.pushState = function() {
            var result = pushState.apply(history, arguments);
            setTimeout(postNav, 0);
            return result;
          };
          history.replaceState = function() {
            var result = replaceState.apply(history, arguments);
            setTimeout(postNav, 0);
            return result;
          };
          window.addEventListener('popstate', postNav);
          window.addEventListener('hashchange', postNav);
          window.addEventListener('load', postNav);
          document.addEventListener('visibilitychange', postNav);
        }
        ${authLines}
        postNav();
      } catch (e) {}
    })();
    true;
  `
}

export function EmbeddedWebAppScreen({ webPath, onCloseRequest }: EmbeddedWebAppScreenProps) {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const { height: winH } = useWindowDimensions()
  const { user, accessToken } = useAuth()
  const origin = useMemo(() => getWebAppOrigin(), [])
  const targetPath = safeWebPath(webPath)
  const targetUri = `${origin}${targetPath}`

  const [webUri, setWebUri] = useState<string | null>(Platform.OS === 'web' ? targetUri : null)
  const [loadErr, setLoadErr] = useState('')
  const [webCanGoBack, setWebCanGoBack] = useState(false)
  const [nativeCanGoBack, setNativeCanGoBack] = useState(false)
  const [handoffNonce, setHandoffNonce] = useState(0)
  const [authPayload, setAuthPayload] = useState<{
    userJson: string
    accessToken: string
    refreshToken: string | null
  } | null>(null)
  const [useLocalStorageFallback, setUseLocalStorageFallback] = useState(false)
  const canGoBackInWeb = webCanGoBack || nativeCanGoBack
  const webRef = useRef<WebView | null>(null)
  const logoutSyncStarted = useRef(false)
  const authUrlIntercepts = useRef(0)

  useEffect(() => {
    if (Platform.OS === 'web') {
      setWebUri(targetUri)
      return
    }
    if (!user || !accessToken) {
      setWebUri(null)
      return
    }

    let cancelled = false
    setLoadErr('')
    setWebUri(null)
    setUseLocalStorageFallback(false)
    authUrlIntercepts.current = 0
    void (async () => {
      const refreshToken = await getStoredRefreshToken()
      if (cancelled) return
      const payload = {
        userJson: JSON.stringify(user),
        accessToken,
        refreshToken: refreshToken ?? null,
      }
      setAuthPayload(payload)
      try {
        const session = await createMobileWebAuthSession()
        if (cancelled) return
        const params = new URLSearchParams()
        params.set('token', session.token)
        params.set('next', targetPath)
        setWebUri(`${origin}/mobile-app-auth?${params.toString()}`)
      } catch {
        if (cancelled) return
        setUseLocalStorageFallback(true)
        setWebUri(targetUri)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, handoffNonce, origin, targetPath, targetUri, user])

  const onError = useCallback(() => {
    setLoadErr(t('webEmbedLoadError'))
  }, [t])

  const startLocalStorageFallback = useCallback(() => {
    authUrlIntercepts.current += 1
    setLoadErr('')
    setUseLocalStorageFallback(true)
    setWebUri(targetUri)
  }, [targetUri])

  const handleWebsiteUrl = useCallback((url: string): boolean => {
    if (Platform.OS === 'web') return false
    try {
      const next = new URL(url)
      const appOrigin = new URL(origin)
      if (next.origin !== appOrigin.origin) return false

      const path = normalizePathname(next.pathname)
      if (path === '/mobile-app-auth') return false

      if (isWebsiteAuthPath(path)) {
        if (authPayload && !useLocalStorageFallback && authUrlIntercepts.current < 1) {
          startLocalStorageFallback()
        } else if (!logoutSyncStarted.current) {
          logoutSyncStarted.current = true
          void logoutLocally('login')
        }
        return true
      }

      if (path === '/') {
        if (!logoutSyncStarted.current) {
          logoutSyncStarted.current = true
          void logoutLocally('landing')
        }
        return true
      }
    } catch {
      return false
    }
    return false
  }, [authPayload, origin, startLocalStorageFallback, useLocalStorageFallback])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data)
      if (payload?.type === 'edmission.logout') {
        if (logoutSyncStarted.current) return
        logoutSyncStarted.current = true
        void logoutLocally()
        return
      }
      if (payload?.type === 'edmission.mobileAuthError') {
        const message = typeof payload.message === 'string' && payload.message.trim()
          ? payload.message
          : t('webEmbedLoadError')
        setLoadErr(message)
        setWebUri(null)
        return
      }
      if (payload?.type === 'edmission.nav') {
        if (typeof payload.url === 'string' && handleWebsiteUrl(payload.url)) return
        setWebCanGoBack(Boolean(payload.canGoBack))
      }
    } catch {
      /* ignore unrelated messages */
    }
  }, [handleWebsiteUrl, t])

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    handleWebsiteUrl(navState.url)
    setNativeCanGoBack(Boolean(navState.canGoBack))
  }, [handleWebsiteUrl])

  const onShouldStartLoadWithRequest = useCallback((request: WebViewNavigation) => {
    return !handleWebsiteUrl(request.url)
  }, [handleWebsiteUrl])

  const nativeShellScript = useMemo(
    () => buildNativeShellScript(useLocalStorageFallback ? authPayload : null),
    [authPayload, useLocalStorageFallback]
  )

  useEffect(() => {
    setWebCanGoBack(false)
    setNativeCanGoBack(false)
  }, [webUri])

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBackInWeb) return false
      webRef.current?.goBack()
      return true
    })
    return () => sub.remove()
  }, [canGoBackInWeb])

  if (!user || !accessToken) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.textMuted }}>{t('webEmbedNeedLogin')}</Text>
      </SafeAreaView>
    )
  }

  if (!webUri || loadErr) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: c.background }]}>
        {loadErr ? (
          <>
            <Text style={[styles.errorText, { color: c.danger }]}>{loadErr}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setHandoffNonce((value) => value + 1)}
                style={[styles.actionButton, { backgroundColor: c.primary }]}
              >
                <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('retry', 'Retry')}</Text>
              </Pressable>
              <Pressable
                onPress={() => void logoutLocally()}
                style={[styles.actionButton, styles.secondaryButton, { borderColor: c.border }]}
              >
                <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{t('back', 'Back')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ActivityIndicator color={c.primary} />
        )}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: c.background },
        Platform.OS === 'web' && { minHeight: Math.max(winH, 480), width: '100%', alignSelf: 'stretch' },
      ]}
      edges={['top']}
    >
      {onCloseRequest ? (
        <View style={[styles.bar, { borderBottomColor: c.border }]}>
          <Pressable onPress={onCloseRequest} hitSlop={12}>
            <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('back')}</Text>
          </Pressable>
          <Text style={{ color: c.textMuted, fontSize: fontSize.xs, flex: 1, marginLeft: space[3] }} numberOfLines={1}>
            {targetUri}
          </Text>
        </View>
      ) : null}
      <PlatformWebView
        webKey={`${webUri}::${handoffNonce}`}
        nativeRef={webRef}
        source={{ uri: webUri }}
        style={styles.web}
        onError={onError}
        onHttpError={onError}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        injectedJavaScriptBeforeContentLoaded={Platform.OS !== 'web' ? nativeShellScript : undefined}
        injectedJavaScript={Platform.OS !== 'web' ? nativeShellScript : undefined}
        pullToRefreshEnabled={Platform.OS !== 'web'}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.center, StyleSheet.absoluteFill, { backgroundColor: c.background }]}>
            <ActivityIndicator color={c.primary} />
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space[4] },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  web: { flex: 1 },
  errorText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: space[4],
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
  },
  actionButton: {
    minWidth: 96,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: space[4],
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
})
