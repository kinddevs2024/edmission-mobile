import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getProfile as refreshAuthProfile, getApiError } from '@/services/auth'
import { createVerificationRequest, getCatalog, type CatalogUniversity } from '@/services/university'
import { getImageUrl } from '@/services/upload'
import type { UniversityGateStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityGateStackParamList, 'UniversitySelect'>

function parseConflict(err: unknown): 'profile' | 'sent' | null {
  if (!axios.isAxiosError(err) || !err.response?.data) return null
  const data = err.response.data as { code?: string; message?: string }
  const msg = (data.message ?? '').toLowerCase()
  if (data.code === 'CONFLICT' && msg.includes('profile already exists')) return 'profile'
  if (data.code === 'CONFLICT' && msg.includes('request already sent')) return 'sent'
  return null
}

export function UniversitySelectScreen({ navigation }: Props) {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const [list, setList] = useState<CatalogUniversity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherName, setOtherName] = useState('')
  const [otherYear, setOtherYear] = useState('')
  const [otherBusy, setOtherBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    void getCatalog({ search: search.trim() || undefined })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [search])

  const handleSet = async (universityId: string) => {
    setError('')
    setSubmittingId(universityId)
    try {
      await createVerificationRequest(universityId)
      await refreshAuthProfile()
    } catch (err) {
      const kind = parseConflict(err)
      if (kind === 'profile' || kind === 'sent') {
        await refreshAuthProfile().catch(() => {})
      } else {
        setError(getApiError(err).message)
      }
    } finally {
      setSubmittingId(null)
    }
  }

  const handleOtherSubmit = async () => {
    const name = otherName.trim()
    if (!name) return
    setError('')
    setOtherBusy(true)
    try {
      await createVerificationRequest({
        universityName: name,
        establishedYear: otherYear.trim() ? parseInt(otherYear, 10) : undefined,
      })
      setOtherOpen(false)
      setOtherName('')
      setOtherYear('')
      await refreshAuthProfile()
    } catch (err) {
      const kind = parseConflict(err)
      if (kind === 'profile' || kind === 'sent') {
        setOtherOpen(false)
        await refreshAuthProfile().catch(() => {})
      } else {
        setError(getApiError(err).message)
      }
    } finally {
      setOtherBusy(false)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('university:selectYourUniversity', 'Select your university')}</Text>
      <Text style={[styles.p, { color: c.textMuted }]}>
        {t('university:selectUniversityHint', 'Find your university and send a verification request.')}
      </Text>
      <TextInput
        value={search}
        onChangeText={(v) => {
          setSearch(v)
          setError('')
        }}
        placeholder={t('common:search')}
        placeholderTextColor={c.textMuted}
        style={[styles.input, { borderColor: c.border, color: c.text }]}
      />
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={c.primary} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingBottom: space[8] }}
          ListEmptyComponent={
            <View>
              <Text style={{ color: c.textMuted, marginBottom: space[3] }}>
                {t('university:noUniversitiesInCatalog', 'No universities found.')}
              </Text>
              <Pressable style={[styles.btn, { backgroundColor: c.secondary }]} onPress={() => setOtherOpen(true)}>
                <Text style={{ color: c.text }}>{t('university:otherUniversity', 'Other')}</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={styles.row}>
                {item.logoUrl ? (
                  <Image source={{ uri: getImageUrl(item.logoUrl) }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, { backgroundColor: c.border }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: c.text }]}>{item.name || item.universityName}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>
                    {[item.city, item.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Pressable
                  style={[styles.smallBtn, { backgroundColor: c.primary }]}
                  onPress={() => void handleSet(item.id)}
                  disabled={submittingId != null}
                >
                  {submittingId === item.id ? (
                    <ActivityIndicator color={c.onPrimary} size="small" />
                  ) : (
                    <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>
                      {t('university:setAsMine', 'Set')}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      {!loading && list.length > 0 ? (
        <Pressable style={[styles.outlineBtn, { borderColor: c.primary }]} onPress={() => setOtherOpen(true)}>
          <Text style={{ color: c.primary }}>{t('university:otherUniversity', 'Other')}</Text>
        </Pressable>
      ) : null}

      <Modal visible={otherOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.card }]}>
            <Text style={[styles.h1, { color: c.text, fontSize: fontSize.lg }]}>{t('university:otherUniversity')}</Text>
            <TextInput
              value={otherName}
              onChangeText={(v) => {
                setOtherName(v)
                setError('')
              }}
              placeholder={t('university:enterUniversityName', 'University name')}
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={otherYear}
              onChangeText={setOtherYear}
              placeholder={t('university:foundedYear', 'Year established')}
              placeholderTextColor={c.textMuted}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setOtherOpen(false)} style={styles.modalBtn}>
                <Text style={{ color: c.textMuted }}>{t('common:cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: c.primary, flex: 1 }]}
                onPress={() => void handleOtherSubmit()}
                disabled={otherBusy || !otherName.trim()}
              >
                <Text style={{ color: c.onPrimary, textAlign: 'center' }}>{t('university:sendRequest', 'Send')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[2] },
  p: { fontSize: fontSize.sm, marginBottom: space[4] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  logo: { width: 48, height: 48, borderRadius: 8 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.md },
  btn: { paddingVertical: space[3], paddingHorizontal: space[4], borderRadius: radii.md, alignItems: 'center' },
  outlineBtn: { marginTop: space[3], padding: space[3], borderRadius: radii.md, borderWidth: 1, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: space[4] },
  modalCard: { borderRadius: radii.lg, padding: space[4] },
  modalActions: { flexDirection: 'row', gap: space[2], marginTop: space[3], alignItems: 'center' },
  modalBtn: { padding: space[2] },
})
