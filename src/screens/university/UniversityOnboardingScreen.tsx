import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getApiError } from '@/services/auth'
import { updateUniversityProfile } from '@/services/university'
import type { UniversityStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityStackParamList, 'UniversityOnboarding'>

const STEPS = 5

export function UniversityOnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [slogan, setSlogan] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [studentCount, setStudentCount] = useState('')
  const [description, setDescription] = useState('')
  const [minLanguageLevel, setMinLanguageLevel] = useState('')
  const [tuitionPrice, setTuitionPrice] = useState('')

  const submit = async () => {
    if (!name.trim()) {
      setError(t('university:universityNameRequired', 'University name is required'))
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await updateUniversityProfile({
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        foundedYear: foundedYear.trim() ? parseInt(foundedYear, 10) : undefined,
        studentCount: studentCount.trim() ? parseInt(studentCount, 10) : undefined,
        description: description.trim() || undefined,
        minLanguageLevel: minLanguageLevel.trim() || undefined,
        tuitionPrice: tuitionPrice.trim() ? parseFloat(tuitionPrice) : undefined,
      })
      navigation.replace('UniversityHome')
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h1, { color: c.text }]}>{t('university:onboardingTitle')}</Text>
        <Text style={{ color: c.textMuted, marginBottom: space[3] }}>
          Step {step} / {STEPS}
        </Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

        {step === 1 && (
          <View style={{ gap: space[2] }}>
            <Field label={t('university:universityName')} value={name} onChangeText={setName} c={c} />
            <Field label={t('university:slogan')} value={slogan} onChangeText={setSlogan} c={c} />
            <Field label={t('university:foundedYear')} value={foundedYear} onChangeText={setFoundedYear} c={c} keyboardType="number-pad" />
            <Field label={t('university:studentCount')} value={studentCount} onChangeText={setStudentCount} c={c} keyboardType="number-pad" />
            <Field label={t('university:description')} value={description} onChangeText={setDescription} c={c} multiline />
            <Field
              label={t('university:minLanguageLevelLabel')}
              value={minLanguageLevel}
              onChangeText={setMinLanguageLevel}
              c={c}
            />
            <Field label={t('university:tuitionPriceLabel')} value={tuitionPrice} onChangeText={setTuitionPrice} c={c} keyboardType="decimal-pad" />
          </View>
        )}
        {step === 2 ? (
          <Text style={{ color: c.textMuted, lineHeight: 22 }}>{t('university:onboardingStep2Hint')}</Text>
        ) : null}
        {step === 3 ? (
          <Text style={{ color: c.textMuted, lineHeight: 22 }}>{t('university:onboardingStep3Hint')}</Text>
        ) : null}
        {step === 4 ? (
          <Text style={{ color: c.textMuted, lineHeight: 22 }}>{t('university:onboardingStep4Hint')}</Text>
        ) : null}
        {step === 5 && (
          <Text style={{ color: c.textMuted, marginBottom: space[3] }}>{t('university:onboardingStep5Hint')}</Text>
        )}

        <View style={styles.row}>
          {step > 1 ? (
            <Pressable style={[styles.btn, { borderColor: c.border }]} onPress={() => setStep((s) => s - 1)}>
              <Text style={{ color: c.text }}>{t('common:back')}</Text>
            </Pressable>
          ) : null}
          {step < STEPS ? (
            <Pressable style={[styles.btn, { backgroundColor: c.primary, flex: 1 }]} onPress={() => setStep((s) => s + 1)}>
              <Text style={{ color: c.onPrimary, textAlign: 'center' }}>{t('common:next')}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.btn, { backgroundColor: c.primary, flex: 1 }]}
              onPress={() => void submit()}
              disabled={submitting}
            >
              <Text style={{ color: c.onPrimary, textAlign: 'center' }}>{t('common:submit')}</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => navigation.replace('UniversityHome')} style={{ marginTop: space[4] }}>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('university:skip')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  c,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  c: ReturnType<typeof useThemeColors>
  multiline?: boolean
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad'
}) {
  return (
    <View>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={c.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.input,
          { borderColor: c.border, color: c.text, minHeight: multiline ? 100 : undefined },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[2] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], fontSize: fontSize.sm },
  row: { flexDirection: 'row', gap: space[2], marginTop: space[4] },
  btn: { paddingVertical: space[3], paddingHorizontal: space[4], borderRadius: radii.md, borderWidth: 1, flex: 1, alignItems: 'center' },
})
