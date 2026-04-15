import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackScreenProps } from '@react-navigation/stack'
import { resendVerificationCode, verifyEmailByCode } from '@/services/auth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { AuthCard } from '@/components/auth/AuthCard'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'VerifyEmail'>

export function VerifyEmailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const c = useThemeColors()
  const email = route.params?.email ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const onSubmit = async () => {
    const digits = code.replace(/\D/g, '').slice(0, 6)
    if (!email) {
      setError(t('auth:invalidEmail'))
      return
    }
    if (digits.length !== 6) {
      setError(`${t('auth:enterCode')} - 6 digits`)
      return
    }

    setError('')
    setLoading(true)
    try {
      await verifyEmailByCode(email, digits)
    } catch (err) {
      setError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (!email || resendCooldown > 0 || resendLoading) return
    setError('')
    setResendLoading(true)
    try {
      await resendVerificationCode(email)
      setResendCooldown(60)
    } catch (err) {
      setError(getFormSubmitErrorMessage(err, t))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.scrollContent}>
      <AuthCard>
        <Text style={[styles.title, { color: c.text }]}>{t('auth:verifyEmail')}</Text>
        <Text style={[styles.message, { color: c.textMuted }]}>
          {email
            ? t('auth:verificationCodeSent', { email })
            : t('auth:verifyEmailSent', 'We sent a verification link to your email.')}
        </Text>

        <AppTextField
          label={t('auth:enterCode')}
          value={code}
          onChangeText={(value) => {
            setCode(value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholder={t('auth:codePlaceholder', '000000')}
          error={error}
        />

        <AppButton title={t('auth:verifyAndContinue')} loading={loading} onPress={onSubmit} disabled={!email} />

        <View style={styles.row}>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: c.textMuted }]}>{t('auth:backToLogin')}</Text>
          </Pressable>
          {resendCooldown > 0 ? (
            <Text style={[styles.cooldown, { color: c.textMuted }]}>
              {t('auth:resendIn', { seconds: resendCooldown })}
            </Text>
          ) : (
            <Pressable onPress={onResend} disabled={resendLoading || !email}>
              <Text style={[styles.link, { color: c.primary }]}>
                {resendLoading ? t('common:loading') : t('auth:resendCode')}
              </Text>
            </Pressable>
          )}
        </View>
      </AuthCard>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: space[4],
    paddingBottom: space[6],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: space[4],
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.sm,
    marginBottom: space[4],
    lineHeight: 20,
    textAlign: 'center',
  },
  row: {
    gap: space[2],
    alignItems: 'center',
    marginTop: space[4],
    justifyContent: 'center',
  },
  link: {
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
    fontWeight: fontWeight.medium,
  },
  cooldown: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
})
