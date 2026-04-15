import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { acceptJoinRequest, listJoinRequests, rejectJoinRequest, type JoinRequestItem } from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function CounsellorJoinRequestsScreen() {
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const [list, setList] = useState<JoinRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setError('')
    return listJoinRequests({ status: 'pending', page: 1, limit: 50 })
      .then((res) => setList(res.data ?? []))
      .catch((e) => setError(getApiError(e).message))
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      void load().finally(() => setLoading(false))
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const confirmAccept = (item: JoinRequestItem) => {
    Alert.alert(t('school:acceptRequestTitle'), t('school:acceptRequestMessage', { name: item.studentName }), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('school:accept'),
        onPress: () => void doAccept(item.id),
      },
    ])
  }

  const confirmReject = (item: JoinRequestItem) => {
    Alert.alert(t('school:rejectRequestTitle'), t('school:rejectRequestMessage', { name: item.studentName }), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('school:reject'),
        style: 'destructive',
        onPress: () => void doReject(item.id),
      },
    ])
  }

  const doAccept = async (id: string) => {
    setActingId(id)
    try {
      await acceptJoinRequest(id)
      setList((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setActingId(null)
    }
  }

  const doReject = async (id: string) => {
    setActingId(id)
    try {
      await rejectJoinRequest(id)
      setList((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setActingId(null)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('school:joinRequests')}</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>{t('school:joinRequestsHint')}</Text>
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('school:noPendingRequests')}</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{item.studentName}</Text>
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>{item.studentEmail}</Text>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, { backgroundColor: c.success, opacity: actingId === item.id ? 0.6 : 1 }]}
                  onPress={() => confirmAccept(item)}
                  disabled={actingId != null}
                >
                  <Text style={{ color: '#fff', fontWeight: fontWeight.semibold }}>{t('school:accept')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, { backgroundColor: c.danger, opacity: actingId === item.id ? 0.6 : 1 }]}
                  onPress={() => confirmReject(item)}
                  disabled={actingId != null}
                >
                  <Text style={{ color: '#fff', fontWeight: fontWeight.semibold }}>{t('school:reject')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: space[2], marginBottom: space[1] },
  hint: { fontSize: fontSize.sm, marginBottom: space[3] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[4], marginBottom: space[3] },
  actions: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  btn: { flex: 1, paddingVertical: space[2], borderRadius: radii.md, alignItems: 'center' },
})
