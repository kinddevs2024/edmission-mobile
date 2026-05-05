import { useEffect, useRef, useState } from 'react'
import { Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { loginWithYandex, startTelegramAuth, verifyTelegramAuthReady } from '@/services/auth'
import { openYandexOAuthSession } from '@/services/yandexAuthSession'
import {
  getYandexClientId,
  isGoogleOAuthConfigured,
  isYandexOAuthConfigured,
} from '@/config/oauth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { GoogleOAuthBlock } from '@/components/auth/GoogleOAuthBlock'
import { radii, space, useThemeColors } from '@/theme'

type Layout = 'footer' | 'inline'

const yandexLogo =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/1280px-Yandex_icon.svg.png'
const telegramLogo =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/250px-Telegram_2019_Logo.svg.png'

export function AuthOAuthSection({
  mode,
  role = 'student',
  acceptTerms = true,
}: {
  mode: 'login' | 'register'
  layout: Layout
  role?: 'student' | 'university'
  acceptTerms?: boolean
}) {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const c = useThemeColors()
  const [googleBusy, setGoogleBusy] = useState(false)
  const [yandexBusy, setYandexBusy] = useState(false)
  const [telegramBusy, setTelegramBusy] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const oauthLocked = googleBusy || yandexBusy || telegramBusy
  const showGoogle = isGoogleOAuthConfigured()
  const yandexId = getYandexClientId()
  const showYandex = isYandexOAuthConfigured()

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  const ensureRegisterTerms = (): boolean => {
    if (mode !== 'register') return true
    if (acceptTerms) return true
    Alert.alert(t('common:hint'), t('auth:oauthRegisterHint'))
    return false
  }

  const onYandexPress = async () => {
    if (!yandexId || oauthLocked) return
    if (!ensureRegisterTerms()) return
    setYandexBusy(true)
    try {
      const session = await openYandexOAuthSession({
        clientId: yandexId,
        role,
        acceptTerms: mode === 'register',
        flow: mode,
      })
      if (!session) return
      await loginWithYandex({
        code: session.code,
        redirectUri: session.redirectUri,
        ...(mode === 'register' ? { role, acceptTerms: true } : {}),
      })
    } catch (e) {
      Alert.alert(t('common:error'), t(`errors:${getApiErrorKey(e)}`))
    } finally {
      setYandexBusy(false)
    }
  }

  const pollTelegramReady = (sessionId: string, attempt = 0) => {
    if (attempt >= 30) {
      setTelegramBusy(false)
      return
    }
    pollRef.current = setTimeout(async () => {
      try {
        const result = await verifyTelegramAuthReady({ sessionId })
        if (result) {
          setTelegramBusy(false)
          return
        }
      } catch {
        setTelegramBusy(false)
        return
      }
      pollTelegramReady(sessionId, attempt + 1)
    }, 2000)
  }

  const onTelegramPress = async () => {
    if (oauthLocked) return
    if (!ensureRegisterTerms()) return
    if (pollRef.current) clearTimeout(pollRef.current)
    setTelegramBusy(true)
    try {
      const session = await startTelegramAuth({ role })
      await Linking.openURL(session.deepLink)
      pollTelegramReady(session.sessionId)
    } catch (e) {
      setTelegramBusy(false)
      Alert.alert(t('common:error'), t(`errors:${getApiErrorKey(e)}`))
    }
  }

  const socialDisabled = oauthLocked || (mode === 'register' && !acceptTerms)

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: c.border }]} />
      </View>
      <View style={styles.row}>
        {showGoogle ? (
          <GoogleOAuthBlock
            mode={mode}
            role={role}
            googleBusy={googleBusy}
            oauthLocked={oauthLocked}
            setParentGoogleBusy={setGoogleBusy}
            termsAccepted={mode === 'register' ? acceptTerms : true}
            compact
          />
        ) : null}
        {showYandex ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'register' ? t('auth:registerWithYandexId') : t('auth:signInWithYandexId')}
            disabled={socialDisabled || yandexBusy}
            onPress={() => void onYandexPress()}
            style={({ pressed }) => [
              styles.iconButton,
              { borderColor: c.border, backgroundColor: c.card },
              (pressed || yandexBusy) && styles.pressed,
              (socialDisabled || yandexBusy) && styles.disabled,
            ]}
          >
            <Image source={{ uri: yandexLogo }} resizeMode="contain" style={styles.logo} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth:continueWithTelegram', 'Continue with Telegram')}
          disabled={socialDisabled || telegramBusy}
          onPress={() => void onTelegramPress()}
          style={({ pressed }) => [
            styles.iconButton,
            { borderColor: c.border, backgroundColor: c.card },
            (pressed || telegramBusy) && styles.pressed,
            (socialDisabled || telegramBusy) && styles.disabled,
          ]}
        >
          <Image source={{ uri: telegramLogo }} resizeMode="contain" style={styles.logo} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space[5],
  },
  divider: {
    alignItems: 'center',
    marginBottom: space[4],
  },
  line: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  iconButton: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 21,
    height: 21,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
})
