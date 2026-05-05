import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
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
      <View style={styles.brand}>
        <Image source={require('../../../assets/icon-square.png')} resizeMode="contain" style={styles.logo} />
        <Text style={[styles.brandText, { color: c.text }]}>Edmission</Text>
      </View>
      <AuthCard>
        <Text style={[styles.title, { color: c.text }]}>{t('auth:signinTitle', 'Sign in to Edmission')}</Text>

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
          <Text style={[styles.err, { color: c.danger, backgroundColor: `${c.danger}14` }]}>{submitError}</Text>
        ) : null}

        <AppButton title={t('common:login')} loading={loading} onPress={onSubmit} disabled={loading || submitLocked} />

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkItem}>
            <Text style={[styles.link, { color: c.primary }]}>{t('auth:forgotPassword')}?</Text>
          </Pressable>
          <Text style={[styles.separator, { color: c.textMuted }]}>·</Text>
          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkItem}>
            <Text style={[styles.link, { color: c.primary }]}>{t('common:register')}</Text>
          </Pressable>
          <Text style={[styles.separator, { color: c.textMuted }]}>·</Text>
          <Pressable onPress={() => navigation.navigate('ChooseLanguage')} style={styles.linkItem}>
            <Text style={[styles.link, { color: c.primary }]}>{t('common:language', 'Language')}</Text>
          </Pressable>
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
    paddingTop: space[6],
    paddingBottom: space[6],
  },
  brand: {
    alignItems: 'center',
    marginBottom: space[4],
    gap: space[2],
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  brandText: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: space[5],
    textAlign: 'center',
  },
  err: {
    marginBottom: space[3],
    fontSize: fontSize.sm,
    lineHeight: 20,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: 8,
    overflow: 'hidden',
  },
  links: {
    marginTop: space[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: space[2],
    rowGap: space[1],
  },
  linkItem: {
    minHeight: 28,
    justifyContent: 'center',
  },
  link: { fontSize: fontSize.sm, textDecorationLine: 'underline', fontWeight: fontWeight.medium },
  separator: { fontSize: fontSize.sm },
})
