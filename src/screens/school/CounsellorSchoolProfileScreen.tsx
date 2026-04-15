import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { getCounsellorProfile, updateCounsellorProfile } from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function CounsellorSchoolProfileScreen() {
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolDescription, setSchoolDescription] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    void getCounsellorProfile()
      .then((p) => {
        setSchoolName(p.schoolName ?? '')
        setSchoolDescription(p.schoolDescription ?? '')
        setCountry(p.country ?? '')
        setCity(p.city ?? '')
        setIsPublic(p.isPublic !== false)
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [])

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateCounsellorProfile({
        schoolName: schoolName.trim(),
        schoolDescription: schoolDescription.trim(),
        country: country.trim(),
        city: city.trim(),
        isPublic,
      })
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h1, { color: c.text }]}>{t('school:mySchool')}</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('school:mySchoolHint')}</Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

        <Field label={t('school:schoolNameLabel')} value={schoolName} onChangeText={setSchoolName} c={c} />
        <Field
          label={t('school:schoolDescriptionLabel')}
          value={schoolDescription}
          onChangeText={setSchoolDescription}
          c={c}
          multiline
        />
        <Field label={t('school:countryLabel')} value={country} onChangeText={setCountry} c={c} />
        <Field label={t('school:cityLabel')} value={city} onChangeText={setCity} c={c} />

        <View style={[styles.publicRow, { borderColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{t('school:publicProfileLabel')}</Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>
              {t('school:publicProfileHint')}
            </Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: c.border, true: c.primary }} />
        </View>

        <Pressable style={[styles.save, { backgroundColor: c.primary }]} onPress={() => void onSave()} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:save')}</Text>
          )}
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
}: {
  label: string
  value: string
  onChangeText: (s: string) => void
  c: ReturnType<typeof useThemeColors>
  multiline?: boolean
}) {
  return (
    <View style={{ marginBottom: space[3] }}>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={c.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          { borderColor: c.border, color: c.text, minHeight: multiline ? 100 : 44 },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[1] },
  hint: { fontSize: fontSize.sm, marginBottom: space[4] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], fontSize: fontSize.sm },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3],
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: space[4],
  },
  save: { paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center' },
})
