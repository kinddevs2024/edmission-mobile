import { Alert, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTranslation } from 'react-i18next'
import { loginWithGoogle } from '@/services/auth'
import { getWebAppUrl } from '@/config/oauth'
import { openGoogleWebAuthSession } from '@/services/googleAuthSession'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Mode = 'login' | 'register'

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
  termsAccepted?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const c = useThemeColors()
  const webAppUrl = getWebAppUrl()

  const onGooglePress = async () => {
    if (oauthLocked || !webAppUrl) return
    setParentGoogleBusy(true)
    try {
      const session = await openGoogleWebAuthSession({
        mode,
        role,
        acceptTerms: mode === 'register',
      })
      if (!session?.idToken) return
      if (mode === 'register') {
        await loginWithGoogle({
          idToken: session.idToken,
          role,
          acceptTerms: true,
        })
      } else {
        await loginWithGoogle({ idToken: session.idToken, acceptTerms: true })
      }
    } catch (e) {
      Alert.alert(t('common:error'), t(`errors:${getApiErrorKey(e)}`))
    } finally {
      setParentGoogleBusy(false)
    }
  }

  const registerOk = mode !== 'register' || termsAccepted === true
  const canUseGoogle = Boolean(webAppUrl)

  return (
    <Pressable
      accessibilityRole="button"
      disabled={oauthLocked || !registerOk || googleBusy || !canUseGoogle}
      onPress={() => void onGooglePress()}
      style={({ pressed }) => [
        styles.button,
        { borderColor: c.border, backgroundColor: c.card },
        (pressed || googleBusy) && styles.pressed,
        (oauthLocked || !registerOk || !canUseGoogle) && styles.disabled,
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
