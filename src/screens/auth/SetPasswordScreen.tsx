import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setPassword, getProfile } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { colors } from '@/theme/colors'

type FormData = { newPassword: string; confirmPassword: string }

function needsPasswordSetup(user: { mustChangePassword?: boolean; mustSetLocalPassword?: boolean } | null | undefined) {
  return Boolean(user?.mustChangePassword || user?.mustSetLocalPassword)
}

export function SetPasswordScreen() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && !needsPasswordSetup(user)) {
      void getProfile()
    }
  }, [user])

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: newPasswordValueSchema({
            min: t('auth:passwordMinLength'),
            uppercase: t('auth:passwordUppercase'),
            lowercase: t('auth:passwordLowercase'),
            number: t('auth:passwordNumber'),
          }),
          confirmPassword: z.string(),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    setLoading(true)
    try {
      await setPassword(data.newPassword)
      await getProfile()
    } catch (err) {
      setSubmitError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('auth:setPassword')}</Text>
      <Text style={styles.muted}>
        {user?.mustSetLocalPassword
          ? t('auth:oauthSetPasswordPageHint')
          : t('auth:setPasswordHint', 'Choose a secure password for your account.')}
      </Text>
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextField
            label={t('auth:newPassword')}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            secureToggle
            error={errors.newPassword?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextField
            label={t('auth:confirmPassword')}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            secureToggle
            error={errors.confirmPassword?.message}
          />
        )}
      />
      {submitError ? <Text style={styles.err}>{submitError}</Text> : null}
      <AppButton title={t('auth:savePassword', 'Save password')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  muted: { fontSize: 14, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  err: { color: colors.danger, marginBottom: 12, fontSize: 14 },
})
