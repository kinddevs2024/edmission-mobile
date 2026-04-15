import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import type { StackScreenProps } from '@react-navigation/stack'
import { resetPassword } from '@/services/auth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { colors } from '@/theme/colors'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'ResetPassword'>

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const token = route.params?.token ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const schema = z
      .object({
        token: z.string().min(1, t('errors:invalidToken')),
        password: newPasswordValueSchema({
          min: t('auth:passwordMinLength'),
          uppercase: t('auth:passwordUppercase'),
          lowercase: t('auth:passwordLowercase'),
          number: t('auth:passwordNumber'),
        }),
        confirm: z.string(),
      })
      .refine((d) => d.password === d.confirm, {
        message: t('auth:passwordsMustMatch'),
        path: ['confirm'],
      })
    const p = schema.safeParse({ token, password, confirm })
    if (!p.success) {
      setError(p.error.issues[0]?.message ?? '')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(p.data.token, p.data.password)
      navigation.navigate('Login')
    } catch (err) {
      setError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('auth:resetPassword')}</Text>
      {!token ? (
        <Text style={styles.err}>{t('errors:invalidToken')}</Text>
      ) : null}
      <AppTextField label={t('auth:newPassword')} value={password} onChangeText={setPassword} secureToggle />
      <AppTextField label={t('auth:confirmPassword')} value={confirm} onChangeText={setConfirm} secureToggle />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <AppButton title={t('auth:savePassword', 'Save password')} loading={loading} onPress={submit} disabled={!token} />
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>{t('common:login')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
  err: { color: colors.danger, marginBottom: 12, fontSize: 14 },
  link: { color: colors.primary, marginTop: 16, fontSize: 14 },
})
