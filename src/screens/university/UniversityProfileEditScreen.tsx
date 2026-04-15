import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getProfile as refreshAuthUser, getApiError } from '@/services/auth'
import { getUniversityProfile, updateUniversityProfile } from '@/services/university'
import type { UniversityStackParamList, UniversityTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<UniversityTabParamList, 'UniversityProfilePage'>,
  StackNavigationProp<UniversityStackParamList>
>

export function UniversityProfileEditScreen() {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [slogan, setSlogan] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')
  const [minLanguageLevel, setMinLanguageLevel] = useState('')
  const [tuitionPrice, setTuitionPrice] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [studentCount, setStudentCount] = useState('')

  useEffect(() => {
    void getUniversityProfile()
      .then((p) => {
        setName(p.name ?? '')
        setSlogan(p.slogan ?? '')
        setCountry(p.country ?? '')
        setCity(p.city ?? '')
        setDescription(p.description ?? '')
        setLogo(p.logo ?? p.logoUrl ?? '')
        setMinLanguageLevel(p.minLanguageLevel ?? '')
        setTuitionPrice(p.tuitionPrice != null ? String(p.tuitionPrice) : '')
        setFoundedYear(p.foundedYear != null ? String(p.foundedYear) : '')
        setStudentCount(p.studentCount != null ? String(p.studentCount) : '')
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [])

  const onSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateUniversityProfile({
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        description: description.trim() || undefined,
        logo: logo.trim() || undefined,
        minLanguageLevel: minLanguageLevel.trim() || undefined,
        tuitionPrice: tuitionPrice.trim() ? parseFloat(tuitionPrice) : undefined,
        foundedYear: foundedYear.trim() ? parseInt(foundedYear, 10) : undefined,
        studentCount: studentCount.trim() ? parseInt(studentCount, 10) : undefined,
      })
      await refreshAuthUser().catch(() => {})
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
        <Text style={[styles.h1, { color: c.text }]}>{t('university:profileTitle')}</Text>
        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        <L label={t('university:universityName')} value={name} onChangeText={setName} c={c} />
        <L label={t('university:slogan')} value={slogan} onChangeText={setSlogan} c={c} />
        <L label={t('university:logoUrl')} value={logo} onChangeText={setLogo} c={c} />
        <L label={t('university:country')} value={country} onChangeText={setCountry} c={c} />
        <L label={t('university:city')} value={city} onChangeText={setCity} c={c} />
        <L label={t('university:description')} value={description} onChangeText={setDescription} c={c} multiline />
        <L label={t('university:foundedYear')} value={foundedYear} onChangeText={setFoundedYear} c={c} keyboardType="number-pad" />
        <L label={t('university:studentCount')} value={studentCount} onChangeText={setStudentCount} c={c} keyboardType="number-pad" />
        <L label={t('university:minLanguageLevelLabel')} value={minLanguageLevel} onChangeText={setMinLanguageLevel} c={c} />
        <L label={t('university:tuitionPriceLabel')} value={tuitionPrice} onChangeText={setTuitionPrice} c={c} keyboardType="decimal-pad" />
        <Pressable style={[styles.save, { backgroundColor: c.primary }]} onPress={() => void onSave()} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:save')}</Text>
          )}
        </Pressable>
        <Pressable style={styles.link} onPress={() => navigation.navigate('Faculties')}>
          <Text style={{ color: c.primary }}>{t('university:navFaculties')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function L({
  label,
  value,
  onChangeText,
  c,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (s: string) => void
  c: ReturnType<typeof useThemeColors>
  multiline?: boolean
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad'
}) {
  return (
    <View style={{ marginBottom: space[3] }}>
      <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={c.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
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
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[3] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], fontSize: fontSize.sm },
  save: { paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center', marginTop: space[2] },
  link: { marginTop: space[4], alignItems: 'center' },
})
