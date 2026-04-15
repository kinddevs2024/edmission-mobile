import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { generateTempPassword, getStudentProfile, updateMyStudent } from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import type { SchoolStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<SchoolStackParamList, 'CounsellorStudentProfile'>

export function CounsellorStudentProfileScreen({ navigation, route }: Props) {
  const { studentId } = route.params
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [gpa, setGpa] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [bio, setBio] = useState('')

  const load = useCallback(() => {
    setError('')
    return getStudentProfile(studentId)
      .then((p) => {
        const u = p.user as { email?: string } | undefined
        setEmail(u?.email ?? '')
        setFirstName(String(p.firstName ?? ''))
        setLastName(String(p.lastName ?? ''))
        setCountry(String(p.country ?? ''))
        setCity(String(p.city ?? ''))
        setGradeLevel(String(p.gradeLevel ?? ''))
        setGpa(p.gpa != null ? String(p.gpa) : '')
        setSchoolName(String(p.schoolName ?? ''))
        setGraduationYear(p.graduationYear != null ? String(p.graduationYear) : '')
        setBio(String(p.bio ?? ''))
      })
      .catch((e) => setError(getApiError(e).message))
  }, [studentId])

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateMyStudent(studentId, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        gpa: gpa.trim() ? parseFloat(gpa) : undefined,
        schoolName: schoolName.trim() || undefined,
        graduationYear: graduationYear.trim() ? parseInt(graduationYear, 10) : undefined,
        bio: bio.trim() || undefined,
      })
      Alert.alert(t('common:success'), t('school:profileSaved'))
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const onTempPassword = () => {
    Alert.alert(t('school:tempPasswordTitle'), t('school:tempPasswordConfirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:next'),
        onPress: () => {
          void generateTempPassword(studentId)
            .then((res) => {
              Alert.alert(t('school:newTempPasswordTitle'), res.temporaryPassword)
            })
            .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
        },
      },
    ])
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
        <Text style={[styles.h1, { color: c.text }]}>{t('school:studentProfileTitle')}</Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

        <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 4 }}>{t('school:emailLabel')}</Text>
        <Text style={{ color: c.text, marginBottom: space[3] }}>{email || '—'}</Text>

        <L label={t('school:fieldFirstName')} value={firstName} onChangeText={setFirstName} c={c} />
        <L label={t('school:fieldLastName')} value={lastName} onChangeText={setLastName} c={c} />
        <L label={t('school:fieldCity')} value={city} onChangeText={setCity} c={c} />
        <L label={t('school:fieldCountry')} value={country} onChangeText={setCountry} c={c} />
        <L label={t('school:fieldGrade')} value={gradeLevel} onChangeText={setGradeLevel} c={c} />
        <L label={t('school:fieldGpa')} value={gpa} onChangeText={setGpa} c={c} keyboardType="decimal-pad" />
        <L label={t('school:fieldSchoolName')} value={schoolName} onChangeText={setSchoolName} c={c} />
        <L label={t('school:fieldGraduationYear')} value={graduationYear} onChangeText={setGraduationYear} c={c} keyboardType="number-pad" />
        <L label={t('school:fieldBio')} value={bio} onChangeText={setBio} c={c} multiline />

        <Pressable style={[styles.save, { backgroundColor: c.primary }]} onPress={() => void onSave()} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:save')}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.link}
          onPress={() =>
            navigation.navigate('SchoolHome', { screen: 'CounsellorStudentInterests', params: { preselectStudentUserId: studentId } })
          }
        >
          <Text style={{ color: c.primary }}>{t('school:studentInterestsNav')}</Text>
        </Pressable>

        <Pressable style={styles.link} onPress={onTempPassword}>
          <Text style={{ color: c.primary }}>{t('school:generateTempPassword')}</Text>
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
