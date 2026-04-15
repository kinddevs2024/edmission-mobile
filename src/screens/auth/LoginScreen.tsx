import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import type { StackScreenProps } from '@react-navigation/stack'
import { login } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { AuthOAuthSection } from '@/components/auth/AuthOAuthSection'
import { AuthCard } from '@/components/auth/AuthCard'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const c = useThemeColors()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitLocked, setSubmitLocked] = useState(false)

  useEffect(() => {
    if (!submitLocked) return
    const id = setTimeout(() => setSubmitLocked(false), 1500)
    return () => clearTimeout(id)
  }, [submitLocked])

  const onSubmit = async () => {
    if (submitLocked || loading) return
    setSubmitLocked(true)
    const schema = z.object({
      email: z.string().email(t('auth:invalidEmail')),
      password: z.string().min(1, t('auth:passwordRequired')),
    })
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      const e: { email?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (path === 'email') e.email = issue.message
        if (path === 'password') e.password = issue.message
      }
      setFieldErrors(e)
      return
    }
    setFieldErrors({})
    setSubmitError('')
    setLoading(true)
    try {
      await login(parsed.data)
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenScaffold
      scroll
      contentContainerStyle={styles.scrollContent}
    >
      <AuthCard>
        <Text style={[styles.title, { color: c.text }]}>{t('common:login')}</Text>

        <AppTextField
          label={t('auth:email')}
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            setFieldErrors((f) => ({ ...f, email: undefined }))
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t('auth:emailPlaceholder', '')}
          error={fieldErrors.email}
        />
        <AppTextField
          label={t('auth:password')}
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            setFieldErrors((f) => ({ ...f, password: undefined }))
          }}
          secureToggle
          error={fieldErrors.password}
        />

        {submitError ? (
          <Text style={[styles.err, { color: c.danger }]}>{submitError}</Text>
        ) : null}

        <AppButton title={t('common:login')} loading={loading} onPress={onSubmit} disabled={loading || submitLocked} />

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.link, { color: c.primary }]}>{t('auth:forgotPassword')}?</Text>
          </Pressable>
          <View style={styles.secondaryLinks}>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.muted, { color: c.textMuted }]}>
                {t('auth:noAccount')} <Text style={[styles.inlineAction, { color: c.primary }]}>{t('common:register')}</Text>
              </Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ChooseLanguage')}>
              <Text style={[styles.muted, { color: c.textMuted }]}>{t('common:language', 'Language')}</Text>
            </Pressable>
          </View>
        </View>

        <AuthOAuthSection mode="login" layout="footer" />
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
  err: { marginBottom: space[3], fontSize: fontSize.sm },
  links: { marginTop: space[2], gap: space[2], alignItems: 'center' },
  secondaryLinks: { gap: space[1], alignItems: 'center' },
  link: { fontSize: fontSize.sm, textDecorationLine: 'underline', fontWeight: fontWeight.medium },
  muted: { fontSize: fontSize.sm, textAlign: 'center' },
  inlineAction: { fontWeight: fontWeight.semibold },
})
