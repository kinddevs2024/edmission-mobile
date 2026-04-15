import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
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
import { logoutLocally } from '@/services/auth'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

/** Must match edmission-front `src/services/authPersistence.ts` keys. */
function buildAuthInjectionScript(
  userJson: string,
  accessToken: string,
  refreshToken: string | null,
  theme: 'light' | 'dark'
): string {
  const rtLine =
    refreshToken != null && refreshToken !== ''
      ? `localStorage.setItem('auth_refreshToken', ${JSON.stringify(refreshToken)});`
      : ''
  return `
    (function() {
      try {
        var AUTH_KEYS = ['auth_user', 'auth_accessToken', 'auth_refreshToken', 'auth_lastActivityAt'];
        var postAuthState = function() {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'edmission.auth',
                user: localStorage.getItem('auth_user'),
                accessToken: localStorage.getItem('auth_accessToken'),
                refreshToken: localStorage.getItem('auth_refreshToken'),
                lastActivityAt: localStorage.getItem('auth_lastActivityAt')
              }));
            }
          } catch (e) {}
        };
        var postNavState = function() {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              var depth = 0;
              try {
                depth = Number((window.__edmissionNativeNavBridge && window.__edmissionNativeNavBridge.depth) || 0);
              } catch (e) {}
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'edmission.nav',
                canGoBack: depth > 0,
                url: String(location.href || '')
              }));
            }
          } catch (e) {}
        };
        if (!window.__edmissionNativeAuthBridge) {
          window.__edmissionNativeAuthBridge = true;
          var originalSetItem = localStorage.setItem.bind(localStorage);
          var originalRemoveItem = localStorage.removeItem.bind(localStorage);
          var originalClear = localStorage.clear.bind(localStorage);

          localStorage.setItem = function(key, value) {
            var result = originalSetItem(key, value);
            if (AUTH_KEYS.indexOf(String(key)) !== -1) postAuthState();
            return result;
          };

          localStorage.removeItem = function(key) {
            var result = originalRemoveItem(key);
            if (AUTH_KEYS.indexOf(String(key)) !== -1) postAuthState();
            return result;
          };

          localStorage.clear = function() {
            var result = originalClear();
            postAuthState();
            return result;
          };
        }
        if (!window.__edmissionNativeNavBridge) {
          window.__edmissionNativeNavBridge = { depth: 0 };
          var navBridge = window.__edmissionNativeNavBridge;
          var originalPushState = history.pushState.bind(history);
          var originalReplaceState = history.replaceState.bind(history);
          history.pushState = function() {
            var result = originalPushState.apply(history, arguments);
            navBridge.depth = Number(navBridge.depth || 0) + 1;
            postNavState();
            return result;
          };
          history.replaceState = function() {
            var result = originalReplaceState.apply(history, arguments);
            postNavState();
            return result;
          };
          window.addEventListener('popstate', function() {
            navBridge.depth = Math.max(0, Number(navBridge.depth || 0) - 1);
            postNavState();
          });
          window.addEventListener('hashchange', postNavState);
        }

        localStorage.setItem('auth_user', ${JSON.stringify(userJson)});
        localStorage.setItem('auth_accessToken', ${JSON.stringify(accessToken)});
        ${rtLine}
        localStorage.setItem('auth_lastActivityAt', String(Date.now()));

        var uiRaw = localStorage.getItem('edmission-ui');
        var uiData = { state: {}, version: 0 };
        try {
          if (uiRaw) {
            var parsed = JSON.parse(uiRaw);
            if (parsed && typeof parsed === 'object') uiData = parsed;
          }
        } catch (e) {}
        if (!uiData.state || typeof uiData.state !== 'object') uiData.state = {};
        uiData.state = Object.assign({}, uiData.state, {
          theme: ${JSON.stringify(theme)},
          hasThemePreference: true
        });
        if (typeof uiData.version !== 'number') uiData.version = 0;
        localStorage.setItem('edmission-ui', JSON.stringify(uiData));

        try {
          var root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(${JSON.stringify(theme)});
          root.style.colorScheme = ${JSON.stringify(theme)};
        } catch (e) {}

        postAuthState();
        postNavState();
      } catch (e) {}
    })();
    true;
  `
}

export interface EmbeddedWebAppScreenProps {
  /** Path on the SPA, e.g. `/university/flyers/new` */
  webPath: string
  onCloseRequest?: () => void
}

/**
 * Loads the web app in a WebView and seeds the same localStorage keys as the website
 * so ProtectedRoute + API client work inside the embedded SPA.
 * Requires a reachable `EXPO_PUBLIC_WEB_APP_URL` in dev when API and Vite use different hosts.
 */
export function EmbeddedWebAppScreen({ webPath, onCloseRequest }: EmbeddedWebAppScreenProps) {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const scheme = useColorScheme()
  const appTheme: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light'
  const { height: winH } = useWindowDimensions()
  const { user, accessToken } = useAuth()
  const origin = useMemo(() => getWebAppOrigin(), [])
  const uri = `${origin}${webPath.startsWith('/') ? webPath : `/${webPath}`}`

  const [authPayload, setAuthPayload] = useState<{
    userJson: string
    accessToken: string
    refreshToken: string | null
  } | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [webCanGoBack, setWebCanGoBack] = useState(false)
  const [nativeCanGoBack, setNativeCanGoBack] = useState(false)
  const canGoBackInWeb = webCanGoBack || nativeCanGoBack
  const webRef = useRef<WebView | null>(null)
  const logoutSyncStarted = useRef(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!user || !accessToken) {
        setAuthPayload(null)
        return
      }
      const rt = await getStoredRefreshToken()
      if (cancelled) return
      setAuthPayload({
        userJson: JSON.stringify(user),
        accessToken,
        refreshToken: rt ?? null,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [user, accessToken])

  const injectedNative = useMemo(() => {
    if (!authPayload) return ''
    return buildAuthInjectionScript(
      authPayload.userJson,
      authPayload.accessToken,
      authPayload.refreshToken,
      appTheme
    )
  }, [appTheme, authPayload])

  const onError = useCallback(() => {
    setLoadErr(t('webEmbedLoadError'))
  }, [t])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data)
      if (payload?.type === 'edmission.nav') {
        setWebCanGoBack(Boolean(payload.canGoBack))
        return
      }
      if (payload?.type !== 'edmission.auth') return
      const userValue = typeof payload.user === 'string' ? payload.user : ''
      const accessValue = typeof payload.accessToken === 'string' ? payload.accessToken : ''
      if (userValue && accessValue) {
        logoutSyncStarted.current = false
        return
      }
      if (logoutSyncStarted.current) return
      logoutSyncStarted.current = true
      void logoutLocally()
    } catch {
      /* ignore unrelated messages */
    }
  }, [])

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setNativeCanGoBack(Boolean(navState.canGoBack))
  }, [])

  useEffect(() => {
    setWebCanGoBack(false)
    setNativeCanGoBack(false)
  }, [uri])

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

  if (!authPayload) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
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
            {uri}
          </Text>
        </View>
      ) : null}
      {loadErr ? (
        <View style={styles.banner}>
          <Text style={{ color: c.danger, fontSize: fontSize.sm }}>{loadErr}</Text>
          {Platform.OS === 'web' ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 6 }}>{t('webEmbedDevHint')}</Text>
          ) : null}
        </View>
      ) : null}
      <PlatformWebView
        webKey={`${uri}::${appTheme}`}
        nativeRef={webRef}
        source={{ uri }}
        webEmbedAuthSeed={Platform.OS === 'web' ? authPayload : undefined}
        injectedJavaScriptBeforeContentLoaded={Platform.OS !== 'web' ? injectedNative : undefined}
        style={styles.web}
        onError={onError}
        onHttpError={onError}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
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
  banner: { padding: space[3] },
})
