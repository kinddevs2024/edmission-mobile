import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactElement,
} from 'react'
import { Platform, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native'
import { WebView as RNWebView, type WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview'

/** Structured auth handoff for web iframe (postMessage — no eval). Must match edmission-front `nativeShellEmbed` schema. */
export type WebEmbedAuthSeed = {
  userJson: string
  accessToken: string
  refreshToken: string | null
}

export type PlatformWebViewProps = {
  source: { uri: string }
  style?: ViewStyle
  injectedJavaScriptBeforeContentLoaded?: string
  injectedJavaScript?: string
  /** Web only: seed auth via postMessage to iframe (preferred over eval). */
  webEmbedAuthSeed?: WebEmbedAuthSeed | null
  onError?: () => void
  onHttpError?: () => void
  javaScriptEnabled?: boolean
  domStorageEnabled?: boolean
  sharedCookiesEnabled?: boolean
  startInLoadingState?: boolean
  renderLoading?: () => ReactElement
  onMessage?: (event: WebViewMessageEvent) => void
  onNavigationStateChange?: (navState: WebViewNavigation) => void
  onShouldStartLoadWithRequest?: (request: WebViewNavigation) => boolean
  pullToRefreshEnabled?: boolean
  nativeRef?: RefObject<WebView | null>
  /** Remount when the URL changes (same as `key` on native WebView). */
  webKey?: string
}

function WebIframe({
  uri,
  style,
  injectScript,
  webEmbedAuthSeed,
  onError,
  startInLoadingState,
  renderLoading,
  iframeKey,
}: {
  uri: string
  style?: ViewStyle
  injectScript?: string
  webEmbedAuthSeed?: WebEmbedAuthSeed | null
  onError?: () => void
  startInLoadingState?: boolean
  renderLoading?: () => ReactElement
  iframeKey: string
}) {
  const { height: winH } = useWindowDimensions()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [loaded, setLoaded] = useState(!startInLoadingState)

  useEffect(() => {
    setLoaded(!startInLoadingState)
  }, [uri, startInLoadingState])

  const handleLoad = useCallback(() => {
    setLoaded(true)
    const el = iframeRef.current
    if (!el) return
    try {
      const targetOrigin = new URL(uri).origin
      if (webEmbedAuthSeed) {
        el.contentWindow?.postMessage(
          {
            __edmission: true,
            type: 'AUTH_SEED',
            v: 1,
            userJson: webEmbedAuthSeed.userJson,
            accessToken: webEmbedAuthSeed.accessToken,
            refreshToken: webEmbedAuthSeed.refreshToken ?? null,
          },
          targetOrigin
        )
        return
      }
      if (!injectScript) return
      const cw = el.contentWindow as unknown as { eval?: (code: string) => void } | null
      cw?.eval?.(injectScript)
    } catch {
      /* Bad URL or cross-origin eval blocked — sign in inside the frame if needed. */
    }
  }, [injectScript, uri, webEmbedAuthSeed])

  const hostStyle: ViewStyle = {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: Math.max(winH, 480),
  }

  const iframeStyle = {
    width: '100%',
    minHeight: Math.max(winH, 480),
    height: Math.max(winH, 480),
    border: 'none',
    display: 'block',
    verticalAlign: 'top' as const,
  }

  return (
    <View style={[hostStyle, style]}>
      {createElement('iframe', {
        key: iframeKey,
        ref: (node: HTMLIFrameElement | null) => {
          iframeRef.current = node
        },
        src: uri,
        title: 'Edmission',
        style: iframeStyle,
        onLoad: handleLoad,
        onError: onError,
      })}
      {startInLoadingState && !loaded && renderLoading ? (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]} pointerEvents="none">
          {renderLoading()}
        </View>
      ) : null}
    </View>
  )
}

/**
 * `react-native-webview` is a no-op on web and shows an error string. This component uses an iframe on web.
 */
export function PlatformWebView({
  webKey,
  source,
  style,
  injectedJavaScriptBeforeContentLoaded,
  injectedJavaScript,
  webEmbedAuthSeed,
  onError,
  onHttpError,
  javaScriptEnabled,
  domStorageEnabled,
  sharedCookiesEnabled,
  startInLoadingState,
  renderLoading,
  onMessage,
  onNavigationStateChange,
  onShouldStartLoadWithRequest,
  pullToRefreshEnabled,
  nativeRef,
}: PlatformWebViewProps) {
  if (Platform.OS === 'web') {
    return (
      <WebIframe
        uri={source.uri}
        style={style}
        injectScript={injectedJavaScriptBeforeContentLoaded}
        webEmbedAuthSeed={webEmbedAuthSeed}
        onError={onError}
        startInLoadingState={startInLoadingState}
        renderLoading={renderLoading}
        iframeKey={webKey ?? source.uri}
      />
    )
  }

  return (
    <RNWebView
      ref={nativeRef}
      key={webKey ?? source.uri}
      source={source}
      injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
      injectedJavaScript={injectedJavaScript}
      style={style}
      onError={onError}
      onHttpError={onHttpError}
      javaScriptEnabled={javaScriptEnabled}
      domStorageEnabled={domStorageEnabled}
      sharedCookiesEnabled={sharedCookiesEnabled}
      pullToRefreshEnabled={pullToRefreshEnabled}
      onMessage={onMessage}
      onNavigationStateChange={onNavigationStateChange}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      startInLoadingState={startInLoadingState}
      renderLoading={renderLoading}
    />
  )
}
