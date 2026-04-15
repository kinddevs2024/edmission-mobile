import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import type { StackScreenProps } from '@react-navigation/stack'
import { forgotPassword } from '@/services/auth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { AuthCard } from '@/components/auth/AuthCard'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const c = useThemeColors()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    const schema = z.object({
      email: z.string().email(t('auth:invalidEmail')),
    })
    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? '')
      return
    }

    setFieldError('')
    setSubmitError('')
    setLoading(true)
    try {
      await forgotPassword(parsed.data.email)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.scrollContent}>
      <AuthCard>
        <Text style={[styles.title, { color: c.text }]}>{t('auth:resetPassword')}</Text>

        {submitted ? (
          <>
            <Text style={[styles.message, { color: c.textMuted }]}>
              {t(
                'auth:forgotPasswordSent',
                `If an account exists for ${email}, reset instructions have been sent.`
              )}
            </Text>
            <Text style={[styles.message, { color: c.textMuted }]}>
              {t('auth:forgotPasswordSentHint', 'Please check your inbox and spam folder.')}
            </Text>
            <AppButton title={t('auth:backToLogin')} onPress={() => navigation.navigate('Login')} />
          </>
        ) : (
          <>
            <Text style={[styles.message, { color: c.textMuted }]}>
              {t(
                'auth:forgotPasswordInstructions',
                'Enter your email and we will send a password reset link if the account exists.'
              )}
            </Text>
            <AppTextField
              label={t('auth:email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                setFieldError('')
                setSubmitError('')
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('auth:emailPlaceholder', '')}
              error={fieldError}
            />
            {submitError ? <Text style={[styles.error, { color: c.danger }]}>{submitError}</Text> : null}
            <AppButton title={t('common:submit')} loading={loading} onPress={onSubmit} />
            <View style={styles.links}>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.link, { color: c.primary }]}>{t('auth:backToLogin')}</Text>
              </Pressable>
            </View>
          </>
        )}
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
  error: {
    marginBottom: space[3],
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  links: {
    marginTop: space[3],
    alignItems: 'center',
  },
  link: {
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
    fontWeight: fontWeight.medium,
  },
})
