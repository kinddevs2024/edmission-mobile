import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { StackScreenProps } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import {
  register as registerApi,
  verifyEmailByCode,
  resendVerificationCode,
} from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { AuthOAuthSection } from '@/components/auth/AuthOAuthSection'
import { AuthCard } from '@/components/auth/AuthCard'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ScreenScaffold } from '@/components/ui/ScreenScaffold'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'Register'>
type FlowStep = 'email' | 'password' | 'code'
const steps: FlowStep[] = ['email', 'password', 'code']

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const c = useThemeColors()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<FlowStep>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendLoading, setResendLoading] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(t('auth:invalidEmail')),
          password: z
            .string()
            .min(8, t('auth:passwordMinLength'))
            .refine((p) => /[A-Z]/.test(p), t('auth:passwordUppercase', 'At least one uppercase letter'))
            .refine((p) => /[a-z]/.test(p), t('auth:passwordLowercase', 'At least one lowercase letter'))
            .refine((p) => /\d/.test(p), t('auth:passwordNumber', 'At least one number')),
          confirmPassword: z.string(),
          acceptTerms: z.boolean().refine((v) => v === true, { message: t('auth:acceptTermsRequired') }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )

  type FormData = z.infer<typeof schema>

  const {
    control,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const emailValue = watch('email')?.trim() ?? ''
  const stepIndex = steps.indexOf(step)

  useEffect(() => {
    if (step !== 'code' || resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((x) => Math.max(0, x - 1)), 1000)
    return () => clearInterval(id)
  }, [step, resendCooldown])

  const goToPasswordStep = async () => {
    setSubmitError('')
    const valid = await trigger('email')
    if (!valid) return
    setStep('password')
  }

  const backToEmailStep = () => {
    setSubmitError('')
    setStep('email')
  }

  const onResend = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setCodeError('')
    try {
      await resendVerificationCode(pendingEmail)
      setResendCooldown(60)
    } catch (err) {
      const apiErr = getApiError(err)
      setCodeError(apiErr.message ?? t('errors:unknown'))
    } finally {
      setResendLoading(false)
    }
  }

  const onCreateAccount = async () => {
    setSubmitError('')
    const valid = await trigger(['email', 'password', 'confirmPassword', 'acceptTerms'])
    if (!valid) return

    const data = getValues()
    setLoading(true)
    try {
      const result = await registerApi({
        email: data.email,
        password: data.password,
        role: 'student',
        acceptTerms: true,
      })
      if ('needsVerification' in result && result.needsVerification) {
        setPendingEmail(result.email)
        setResendCooldown(60)
        setStep('code')
      }
    } catch (err) {
      const apiErr = getApiError(err)
      const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
      setSubmitError(firstMsg ?? t(`errors:${getApiErrorKey(err)}`))
    } finally {
      setLoading(false)
    }
  }

  const onVerifyCode = async () => {
    const digits = code.replace(/\D/g, '').slice(0, 6)
    if (digits.length !== 6) {
      setCodeError(t('auth:codeInvalid', 'Enter the full 6-digit code.'))
      return
    }
    setCodeError('')
    setCodeLoading(true)
    try {
      await verifyEmailByCode(pendingEmail, digits)
    } catch (err) {
      const apiErr = getApiError(err)
      setCodeError(apiErr.message ?? t('errors:unknown'))
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.scrollContent}>
      <View style={styles.brand}>
        <Image source={require('../../../assets/icon-square.png')} resizeMode="contain" style={styles.logo} />
        <Text style={[styles.brandText, { color: c.text }]}>Edmission</Text>
      </View>
      <AuthCard>
        <View style={styles.stepper} accessibilityRole="progressbar">
          {steps.map((item, index) => (
            <View
              key={item}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index <= stepIndex ? c.primary : c.border,
                },
              ]}
            />
          ))}
        </View>
        {step === 'email' ? (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t('auth:stepEmailTitle', 'Start with your email')}</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label={t('auth:email')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth:emailPlaceholder', '')}
                  error={errors.email?.message}
                />
              )}
            />

            {submitError ? <Text style={[styles.err, { color: c.danger, backgroundColor: `${c.danger}14` }]}>{submitError}</Text> : null}

            <AppButton title={t('common:next')} onPress={() => void goToPasswordStep()} />

            <AuthOAuthSection mode="register" layout="inline" role="student" acceptTerms />

            <View style={styles.bottomLinks}>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>
                  {t('auth:haveAccount')} <Text style={[styles.inlineAction, { color: c.primary }]}>{t('common:login')}</Text>
                </Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('ChooseLanguage')}>
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>{t('common:language', 'Language')}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {step === 'password' ? (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t('auth:stepPasswordTitle', 'Create your password')}</Text>

            <View style={[styles.summaryCard, { borderColor: c.border, backgroundColor: c.background }]}>
              <View style={styles.summaryCopy}>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t('auth:email')}</Text>
                <Text style={[styles.summaryValue, { color: c.text }]} numberOfLines={1}>
                  {emailValue}
                </Text>
              </View>
              <Pressable onPress={backToEmailStep}>
                <Text style={[styles.link, { color: c.primary }]}>{t('auth:editEmail', 'Change')}</Text>
              </Pressable>
            </View>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label={t('auth:password')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  hint={t('auth:passwordRequirements', '8+ chars, uppercase, lowercase, number')}
                  error={errors.password?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label={t('auth:confirmPassword')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="acceptTerms"
              render={({ field: { onChange, value } }) => (
                <Pressable style={styles.termsRow} onPress={() => onChange(!value)}>
                  <Ionicons
                    name={value ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={value ? c.primary : c.textMuted}
                    style={styles.termsIcon}
                  />
                  <Text style={[styles.termsText, { color: c.text }]}>
                    {t('auth:acceptTerms')}{' '}
                    <Text
                      onPress={() => navigation.navigate('Privacy')}
                      style={{ color: c.primary, textDecorationLine: 'underline' }}
                    >
                      {t('common:privacy')}
                    </Text>
                  </Text>
                </Pressable>
              )}
            />
            {errors.acceptTerms ? (
              <Text style={[styles.err, { color: c.danger, backgroundColor: `${c.danger}14` }]}>{errors.acceptTerms.message}</Text>
            ) : null}

            {submitError ? <Text style={[styles.err, { color: c.danger, backgroundColor: `${c.danger}14` }]}>{submitError}</Text> : null}

            <AppButton title={t('auth:createAccount', 'Create account')} loading={loading} onPress={() => void onCreateAccount()} />

            <View style={styles.bottomLinks}>
              <Pressable onPress={backToEmailStep}>
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>{t('common:back')}</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>
                  {t('auth:haveAccount')} <Text style={[styles.inlineAction, { color: c.primary }]}>{t('common:login')}</Text>
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t('auth:verifyEmail')}</Text>
            <Text style={[styles.muted, { color: c.textMuted }]}>
              {t('auth:verificationCodeSent', { email: pendingEmail })}
            </Text>

            <AppTextField
              label={t('auth:enterCode')}
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, '').slice(0, 6))
                setCodeError('')
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder={t('auth:codePlaceholder', '000000')}
              error={codeError}
            />

            <AppButton title={t('auth:verifyAndContinue')} loading={codeLoading} onPress={onVerifyCode} />

            <View style={styles.codeFooter}>
              <Pressable onPress={() => setStep('password')}>
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>{t('common:back')}</Text>
              </Pressable>
              {resendCooldown > 0 ? (
                <Text style={[styles.centerMuted, { color: c.textMuted }]}>
                  {t('auth:resendIn', { seconds: resendCooldown })}
                </Text>
              ) : (
                <Pressable onPress={onResend} disabled={resendLoading}>
                  <Text style={[styles.link, { color: c.primary }]}>
                    {resendLoading ? t('common:loading') : t('auth:resendCode')}
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}
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
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[1],
    marginBottom: space[4],
    marginTop: space[1],
  },
  stepDot: {
    width: 26,
    height: 4,
    borderRadius: 4,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: space[5],
    textAlign: 'center',
  },
  muted: {
    fontSize: fontSize.sm,
    marginBottom: space[4],
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    marginBottom: space[4],
    gap: space[3],
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    marginBottom: space[2],
  },
  termsIcon: {
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  err: {
    marginBottom: space[2],
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomLinks: {
    marginTop: space[3],
    gap: space[1.5],
    alignItems: 'center',
  },
  centerMuted: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  inlineAction: {
    fontWeight: fontWeight.semibold,
  },
  codeFooter: {
    marginTop: space[4],
    gap: space[2],
    alignItems: 'center',
  },
})
