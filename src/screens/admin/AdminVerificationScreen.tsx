import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import {
  approveUniversity,
  getVerificationQueue,
  rejectUniversity,
  type VerificationItem,
} from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function AdminVerificationScreen() {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [list, setList] = useState<VerificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getVerificationQueue()
      .then(setList)
      .catch((e) => {
        setError(getApiError(e).message)
        setList([])
      })
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

  const act = (item: VerificationItem, approve: boolean) => {
    Alert.alert(
      approve ? t('admin:approveUniversity') : t('admin:rejectUniversity'),
      item.name,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: approve ? t('admin:approve') : t('admin:reject'),
          style: approve ? 'default' : 'destructive',
          onPress: () => {
            const fn = approve ? approveUniversity : rejectUniversity
            void fn(item.universityId)
              .then(() => load())
              .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:mobileVerificationTitle')}</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>{t('admin:mobileVerificationHint')}</Text>
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={<Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('admin:mobileNoVerification')}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{item.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>{item.email}</Text>
              {item.country ? (
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>{item.country}</Text>
              ) : null}
              <View style={styles.row}>
                <Pressable style={[styles.btn, { backgroundColor: c.success }]} onPress={() => act(item, true)}>
                  <Text style={styles.btnTxt}>{t('admin:approve')}</Text>
                </Pressable>
                <Pressable style={[styles.btn, { backgroundColor: c.danger }]} onPress={() => act(item, false)}>
                  <Text style={styles.btnTxt}>{t('admin:reject')}</Text>
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
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: space[2] },
  hint: { fontSize: fontSize.sm, marginBottom: space[3], marginTop: 4 },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  row: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  btn: { flex: 1, paddingVertical: space[2], borderRadius: radii.md, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: fontWeight.semibold },
})
