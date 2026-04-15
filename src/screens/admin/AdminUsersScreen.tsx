import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { getUsers, suspendUser, type AdminUserRow } from '@/services/adminApi'
import { getApiError } from '@/services/auth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

const LIMIT = 30

export function AdminUsersScreen() {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const [role, setRole] = useState('')
  const [list, setList] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AdminUserRow | null>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(
    async (p: number, reset: boolean) => {
      setError('')
      try {
        const res = await getUsers({ page: p, limit: LIMIT, role: role || undefined })
        setTotal(res.total)
        setList((prev) => (reset ? res.data : [...prev, ...res.data]))
        setPage(p)
      } catch (e) {
        setError(getApiError(e).message)
        if (reset) setList([])
      }
    },
    [role]
  )

  useEffect(() => {
    setLoading(true)
    void load(1, true).finally(() => setLoading(false))
  }, [role, load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(1, true)
    setRefreshing(false)
  }

  const loadMore = () => {
    if (loading || list.length >= total) return
    void load(page + 1, false)
  }

  const toggleSuspend = (u: AdminUserRow) => {
    const suspend = u.status === 'active'
    Alert.alert(
      suspend ? t('admin:confirmSuspendTitle') : t('admin:confirmUnsuspendTitle'),
      u.email,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: suspend ? t('admin:suspend') : t('admin:unsuspend'),
          style: suspend ? 'destructive' : 'default',
          onPress: () => {
            setActing(true)
            void suspendUser(u.id, suspend)
              .then(() => {
                setSelected(null)
                return load(1, true)
              })
              .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
              .finally(() => setActing(false))
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:users')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[
          { key: '', label: t('admin:allRoles') },
          { key: 'student', label: t('admin:students') },
          { key: 'university', label: t('admin:universities') },
          { key: 'admin', label: t('admin:mobileRoleAdmin') },
          { key: 'school_counsellor', label: t('admin:schoolCounsellor') },
        ].map((r) => {
          const active = role === r.key
          const label = r.label
          return (
            <Pressable
              key={r.key || 'all'}
              onPress={() => setRole(r.key)}
              style={[
                styles.chip,
                {
                  borderColor: active ? c.primary : c.border,
                  backgroundColor: active ? c.primaryMuted : c.card,
                },
              ]}
            >
              <Text style={{ color: active ? c.primaryDark : c.text, fontSize: fontSize.sm }}>{label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
          ) : (
            <Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('admin:noUsersFound')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}
            onPress={() => setSelected(item)}
          >
            <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{item.email}</Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>
              {item.role} · {item.status === 'suspended' ? t('admin:suspended') : t('admin:active')}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={selected != null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => !acting && setSelected(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={(e) => e.stopPropagation()}>
            {selected ? (
              <>
                <Text style={[styles.modalTitle, { color: c.text }]}>{selected.email}</Text>
                <Text style={{ color: c.textMuted, marginBottom: space[3] }}>
                  {selected.role} · {selected.status === 'suspended' ? t('admin:suspended') : t('admin:active')}
                </Text>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: selected.status === 'active' ? c.danger : c.primary }]}
                  disabled={acting}
                  onPress={() => toggleSuspend(selected)}
                >
                  <Text style={{ color: '#fff', fontWeight: fontWeight.semibold, textAlign: 'center' }}>
                    {selected.status === 'active' ? t('admin:suspend') : t('admin:unsuspend')}
                  </Text>
                </Pressable>
                <Pressable style={styles.modalClose} onPress={() => !acting && setSelected(null)}>
                  <Text style={{ color: c.primary }}>{t('common:back')}</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: space[2], marginBottom: space[2] },
  chips: { gap: 8, paddingBottom: space[3] },
  chip: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.md, borderWidth: 1, marginRight: 8 },
  row: { padding: space[3], borderRadius: radii.md, borderWidth: 1, marginBottom: space[2] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: space[4] },
  modalCard: { borderRadius: radii.lg, borderWidth: 1, padding: space[4] },
  modalTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  modalBtn: { padding: space[3], borderRadius: radii.md, marginBottom: space[2] },
  modalClose: { alignItems: 'center', padding: space[2] },
})
