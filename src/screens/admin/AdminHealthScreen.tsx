import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { getHealth, type ServiceHealth } from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function AdminHealthScreen() {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [status, setStatus] = useState('')
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getHealth()
      .then((h) => {
        setStatus(h.status)
        setServices(h.services ?? [])
      })
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:mobileHealthScreenTitle')}</Text>
      <Text style={[styles.overall, { color: c.textMuted }]}>
        {t('admin:systemHealth')}: {status || '—'}
      </Text>
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('admin:noDataYet')}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{item.name}</Text>
              <Text style={{ color: item.status === 'up' ? c.success : c.danger, marginTop: 4 }}>{item.status}</Text>
              {item.latency != null ? (
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>
                  {t('admin:mobileLatency')}: {item.latency}ms
                </Text>
              ) : null}
              {item.message ? (
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>{item.message}</Text>
              ) : null}
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
  overall: { marginBottom: space[3] },
  row: { padding: space[3], borderRadius: radii.md, borderWidth: 1, marginBottom: space[2] },
})
