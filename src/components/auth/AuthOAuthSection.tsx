import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { loginWithYandex } from '@/services/auth'
import { openYandexOAuthSession } from '@/services/yandexAuthSession'
import {
  getYandexClientId,
  isGoogleOAuthConfigured,
  isYandexOAuthConfigured,
} from '@/config/oauth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { GoogleOAuthBlock } from '@/components/auth/GoogleOAuthBlock'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Layout = 'footer' | 'inline'

export function AuthOAuthSection({
  mode,
  layout,
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

  const oauthLocked = googleBusy || yandexBusy

  const showGoogle = isGoogleOAuthConfigured()
  const yandexId = getYandexClientId()
  const showYandex = isYandexOAuthConfigured()

  if (!showGoogle && !showYandex) return null

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
      if (mode === 'register') {
        await loginWithYandex({
          code: session.code,
          redirectUri: session.redirectUri,
          role,
          acceptTerms: true,
        })
      } else {
        await loginWithYandex({
          code: session.code,
          redirectUri: session.redirectUri,
        })
      }
    } catch (e) {
      Alert.alert(t('common:error'), t(`errors:${getApiErrorKey(e)}`))
    } finally {
      setYandexBusy(false)
    }
  }

  const loginHint =
    showGoogle && showYandex
      ? t('auth:oauthLoginHint', 'By continuing you agree to our Terms and Privacy Policy.')
      : showYandex
        ? t('auth:yandexLoginHint', 'By continuing with Yandex you agree to our Terms and Privacy Policy.')
        : t('auth:googleLoginHint')

  const registerHint =
    acceptTerms
      ? showGoogle && showYandex
        ? t('auth:oauthContinueHint', 'Continue with Google or Yandex.')
        : showYandex
          ? t('auth:yandexContinueHint', 'Continue with Yandex.')
          : t('auth:googleContinueHint', 'Continue with Google.')
      : showGoogle && showYandex
        ? t(
            'auth:oauthRegisterHint',
            'Accept the terms above, then continue with Google or Yandex.'
          )
        : showYandex
          ? t('auth:yandexRegisterHint', 'Accept the terms above, then continue with Yandex.')
          : t('auth:googleRegisterHint')

  const yandexDisabled =
    oauthLocked || (mode === 'register' && !acceptTerms)

  const yandexBlock = showYandex ? (
    <View
      style={
        mode === 'register' && !acceptTerms
          ? [styles.yandexDim, { opacity: 0.55 }]
          : undefined
      }
    >
      <Pressable
        accessibilityRole="button"
        disabled={yandexDisabled || yandexBusy}
        onPress={() => void onYandexPress()}
        style={({ pressed }) => [
          styles.yandexBtn,
          (pressed || yandexBusy) && styles.yandexPressed,
          (yandexDisabled || yandexBusy) && styles.yandexDisabled,
          styles.btn,
        ]}
      >
        <View style={styles.yandexRow}>
          <View style={styles.yandexBadgeLeft}>
            <Text style={styles.yandexBadgeLeftText}>Y</Text>
          </View>
          <Text style={styles.yandexLabel}>
            {yandexBusy
              ? t('common:loading')
              : mode === 'register'
                ? t('auth:registerWithYandexId')
                : t('auth:signInWithYandexId')}
          </Text>
          <View style={styles.yandexBadgeRight}>
            <View style={styles.yandexBadgeDot} />
          </View>
        </View>
      </Pressable>
    </View>
  ) : null

  const googleBlock = showGoogle ? (
    <GoogleOAuthBlock
      mode={mode}
      role={role}
      googleBusy={googleBusy}
      oauthLocked={oauthLocked}
      setParentGoogleBusy={setGoogleBusy}
      termsAccepted={mode === 'register' ? acceptTerms : true}
      style={styles.btn}
    />
  ) : null

  if (layout === 'footer') {
    return (
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <Text style={[styles.footerHint, { color: c.textMuted }]}>{loginHint}</Text>
        <View style={styles.oauthStack}>
          {googleBlock}
          {yandexBlock}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.inlineWrap}>
      <View style={styles.orWrap}>
        <View style={[styles.orLine, { borderTopColor: c.border }]} />
        <Text style={[styles.orLabel, { color: c.textMuted, backgroundColor: c.card }]}>
          {t('auth:orDivider')}
        </Text>
      </View>
      <Text style={[styles.inlineHint, { color: c.textMuted }]}>{registerHint}</Text>
      <View style={styles.oauthStack}>
        {googleBlock}
        {yandexBlock}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    marginTop: space[6],
    paddingTop: space[6],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  oauthStack: { marginTop: space[2] },
  footerHint: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginBottom: space[1],
  },
  inlineWrap: {
    paddingTop: space[1],
  },
  orWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[2],
    marginBottom: space[1],
  },
  orLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  orLabel: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: space[3],
  },
  inlineHint: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginBottom: space[1],
  },
  btn: { marginBottom: space[2] },
  yandexDim: {},
  yandexBtn: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: '#101418',
    paddingHorizontal: space[3],
    justifyContent: 'center',
  },
  yandexRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  yandexBadgeLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FC3F1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yandexBadgeLeftText: { color: '#fff', fontSize: 12, fontWeight: fontWeight.bold },
  yandexLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  yandexBadgeRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2c313a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yandexBadgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  yandexPressed: { opacity: 0.93 },
  yandexDisabled: { opacity: 0.55 },
})
