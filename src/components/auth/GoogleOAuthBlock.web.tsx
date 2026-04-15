import { useEffect, useMemo, useRef } from 'react'
import { Alert, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import {
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session'
import { useTranslation } from 'react-i18next'
import { loginWithGoogle } from '@/services/auth'
import { getGoogleAuthConfig } from '@/config/oauth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

type Mode = 'login' | 'register'

type Pending = { mode: Mode; role: 'student' | 'university' }

export function GoogleOAuthBlock({
  mode,
  role,
  googleBusy,
  oauthLocked,
  setParentGoogleBusy,
  termsAccepted,
  style,
}: {
  mode: Mode
  role: 'student' | 'university'
  googleBusy: boolean
  oauthLocked: boolean
  setParentGoogleBusy: (v: boolean) => void
  /** Register: must match front — button disabled until terms accepted */
  termsAccepted?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const c = useThemeColors()
  const pendingRef = useRef<Pending | null>(null)
  const processedIdToken = useRef('')

  const { webClientId } = getGoogleAuthConfig()
  const redirectUri = useMemo(
    () =>
      makeRedirectUri({
        scheme: 'edmission',
        path: 'redirect',
      }),
    []
  )

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: webClientId || '__missing__',
      scopes: ['openid', 'profile', 'email'],
      responseType: ResponseType.IdToken,
      redirectUri,
    },
    webClientId ? GOOGLE_DISCOVERY : null
  )

  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = typeof response.params?.id_token === 'string' ? response.params.id_token : ''
    if (!idToken || idToken === processedIdToken.current) return
    const pending = pendingRef.current
    if (!pending) return
    processedIdToken.current = idToken
    pendingRef.current = null

    void (async () => {
      setParentGoogleBusy(true)
      try {
        if (pending.mode === 'register') {
          await loginWithGoogle({
            idToken,
            role: pending.role,
            acceptTerms: true,
          })
        } else {
          await loginWithGoogle({ idToken, acceptTerms: true })
        }
      } catch (e) {
        processedIdToken.current = ''
        Alert.alert(t('common:error'), t(`errors:${getApiErrorKey(e)}`))
      } finally {
        setParentGoogleBusy(false)
      }
    })()
  }, [response, setParentGoogleBusy, t])

  const registerOk = mode !== 'register' || termsAccepted === true
  const disabled = !webClientId || !request || oauthLocked || !registerOk

  const onPress = async () => {
    if (disabled) return
    processedIdToken.current = ''
    pendingRef.current = { mode, role }
    setParentGoogleBusy(true)
    try {
      const r = await promptAsync()
      if (r.type !== 'success') {
        pendingRef.current = null
        setParentGoogleBusy(false)
        return
      }
    } catch {
      pendingRef.current = null
      processedIdToken.current = ''
      setParentGoogleBusy(false)
      Alert.alert(t('common:error'), t('errors:default'))
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || googleBusy}
      onPress={() => void onPress()}
      style={({ pressed }) => [
        styles.button,
        { borderColor: c.border, backgroundColor: c.card },
        (pressed || googleBusy) && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.googleBadge}>
          <Text style={styles.googleBadgeText}>G</Text>
        </View>
        <Text style={[styles.label, { color: c.text }]}>
          {googleBusy ? t('common:loading') : t('auth:continueWithGoogle')}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space[3],
    justifyContent: 'center',
    marginBottom: space[2],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  googleBadgeText: { color: '#4285F4', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  label: { flex: 1, textAlign: 'center', fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.55 },
})
