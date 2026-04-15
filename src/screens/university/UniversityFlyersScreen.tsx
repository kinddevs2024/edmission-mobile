import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import { createUniversityFlyer, deleteUniversityFlyer, getUniversityFlyers } from '@/services/university'
import type { UniversityFlyer } from '@/types/university'
import { getApiError } from '@/services/auth'
import { getImageUrl, uploadFile } from '@/services/upload'
import type { UniversityStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityStackParamList, 'UniversityFlyers'>

export function UniversityFlyersScreen({ navigation }: Props) {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const [list, setList] = useState<UniversityFlyer[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getUniversityFlyers()
      setList(data)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert(t('common:error'), t('university:flyers.permissionDenied', 'Photo library permission required'))
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    })
    if (res.canceled || !res.assets[0]) return
    const asset = res.assets[0]
    setSaving(true)
    setError('')
    try {
      const url = await uploadFile({
        uri: asset.uri,
        name: asset.fileName ?? 'flyer.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      })
      const created = await createUniversityFlyer({
        title: title.trim() || undefined,
        source: 'upload',
        mediaUrl: url,
        mediaType: asset.mimeType ?? 'image/jpeg',
        isPublished: true,
      })
      setList((prev) => [created, ...prev])
      setTitle('')
      setMediaUrl('')
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const createFromUrl = async () => {
    const url = mediaUrl.trim()
    if (!url) return
    setSaving(true)
    setError('')
    try {
      const created = await createUniversityFlyer({
        title: title.trim() || undefined,
        source: 'url',
        mediaUrl: url,
        mediaType: 'image/jpeg',
        isPublished: true,
      })
      setList((prev) => [created, ...prev])
      setTitle('')
      setMediaUrl('')
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = (id: string) => {
    void deleteUniversityFlyer(id)
      .then(() => setList((prev) => prev.filter((x) => x.id !== id)))
      .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: c.text }]}>{t('university:flyers.pageTitle', 'Flyers')}</Text>
        <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginBottom: space[3] }}>
          {t('university:flyers.pageHint', 'Visual posts for students. Upload from gallery or paste a media URL.')}
        </Text>
        {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

        <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 4 }}>
          {t('university:flyers.optionalTitle', 'Title (optional)')}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />

        <Pressable
          style={[styles.btn, { backgroundColor: c.primary }]}
          onPress={() => void pickAndUpload()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>
              {t('university:flyers.uploadFromDevice', 'Upload from device')}
            </Text>
          )}
        </Pressable>

        <Text style={{ color: c.textMuted, marginVertical: space[2], textAlign: 'center' }}>{t('common:orDivider', 'or')}</Text>

        <TextInput
          value={mediaUrl}
          onChangeText={setMediaUrl}
          placeholder="https://..."
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />
        <Pressable
          style={[styles.btn, { borderColor: c.primary, borderWidth: 1 }]}
          onPress={() => void createFromUrl()}
          disabled={saving || !mediaUrl.trim()}
        >
          <Text style={{ color: c.primary }}>{t('university:flyers.addFromUrl', 'Add from URL')}</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, { borderColor: c.border, borderWidth: 1, marginTop: space[2] }]}
          onPress={() => navigation.navigate('UniversityFlyerEditorNew')}
        >
          <Text style={{ color: c.text }}>{t('university:flyers.createWithEditor', 'Editor (web parity)')}</Text>
        </Pressable>

        <Text style={[styles.h2, { color: c.text }]}>{t('university:flyers.yourFlyers', 'Your flyers')}</Text>
        {loading ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          list.map((item) => (
            <View key={item.id} style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
              {item.previewImageUrl || item.mediaUrl ? (
                <Image
                  source={{ uri: getImageUrl(item.previewImageUrl ?? item.mediaUrl) }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{item.title ?? item.id}</Text>
              <Pressable onPress={() => remove(item.id)} style={{ marginTop: space[2] }}>
                <Text style={{ color: c.danger, fontSize: fontSize.xs }}>{t('common:delete')}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[2] },
  h2: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: space[6], marginBottom: space[2] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
  btn: { paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center' },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
  thumb: { width: '100%', height: 160, borderRadius: radii.md, marginBottom: space[2] },
})
