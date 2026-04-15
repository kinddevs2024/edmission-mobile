import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import type { NotificationItem } from '@/types/notifications'
import { deleteNotification, deleteNotificationsBulk, getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications'
import { getApiError } from '@/services/auth'
import { openNotificationLink } from '@/navigation/openNotificationLink'
import { useAuth } from '@/hooks/useAuth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

const TYPE_FILTERS: { key: string; labelKey: string }[] = [
  { key: '', labelKey: 'common:all' },
  { key: 'message', labelKey: 'common:notificationTypeMessage' },
  { key: 'offer', labelKey: 'common:notificationTypeOffer' },
  { key: 'document', labelKey: 'common:documents' },
  { key: 'status_update', labelKey: 'common:notificationTypeStatusUpdate' },
  { key: 'system', labelKey: 'common:notificationTypeSystem' },
]

export function NotificationsScreen() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const navigation = useNavigation()
  const { user, role } = useAuth()

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await getNotifications(
        {
          limit: 50,
          page: 1,
          ...(typeFilter ? { type: typeFilter } : {}),
          ...(unreadOnly ? { unread: true } : {}),
        },
        role
      )
      setItems(res.data ?? [])
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [role, typeFilter, unreadOnly])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    void load()
  }

  const onOpen = (item: NotificationItem) => {
    if (!item.read) {
      void markNotificationRead(item.id).then(() => {
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, read: true } : x)))
      })
    }
    openNotificationLink(navigation as never, user?.role, item.link)
  }

  const onDelete = (id: string) => {
    void deleteNotification(id).then(() => setItems((prev) => prev.filter((x) => x.id !== id)))
  }

  const chips = useMemo(
    () => (
      <View style={styles.chipsRow}>
        {TYPE_FILTERS.map((f) => (
          <Pressable
            key={f.key || 'all'}
            onPress={() => setTypeFilter(f.key)}
            style={[
              styles.chip,
              { borderColor: c.border, backgroundColor: typeFilter === f.key ? c.primaryMuted : c.card },
            ]}
          >
            <Text style={[styles.chipTxt, { color: c.text }]}>{t(f.labelKey as 'common:all')}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setUnreadOnly((u) => !u)}
          style={[
            styles.chip,
            { borderColor: c.border, backgroundColor: unreadOnly ? c.primaryMuted : c.card },
          ]}
        >
          <Text style={[styles.chipTxt, { color: c.text }]}>{t('common:unreadOnly')}</Text>
        </Pressable>
      </View>
    ),
    [c.border, c.card, c.primaryMuted, c.text, t, typeFilter, unreadOnly]
  )

  if (loading && items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <View style={[styles.toolbar, { borderBottomColor: c.border }]}>
        <Pressable
          style={[styles.tbBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => void markAllNotificationsRead().then(() => void load())}
        >
          <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('common:markAllRead')}</Text>
        </Pressable>
        <Pressable
          style={[styles.tbBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() =>
            void deleteNotificationsBulk({ readOnly: true }).then(() => void load())
          }
        >
          <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:deleteRead')}</Text>
        </Pressable>
      </View>
      {chips}
      {error ? (
        <Text style={[styles.err, { color: c.danger }]}>{error}</Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textMuted }]}>{t('common:noNotificationsDesc')}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => onOpen(item)}
          >
            <View style={styles.cardHead}>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              {!item.read ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
            </View>
            {item.body ? (
              <Text style={[styles.body, { color: c.textMuted }]} numberOfLines={3}>
                {item.body}
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <Pressable onPress={() => onDelete(item.id)}>
                <Text style={{ color: c.danger, fontSize: fontSize.xs }}>{t('common:delete')}</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    padding: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tbBtn: {
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], padding: space[3] },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.full, borderWidth: 1 },
  chipTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  err: { paddingHorizontal: space[4], marginBottom: space[2] },
  list: { padding: space[3], paddingBottom: space[10], gap: space[2] },
  empty: { textAlign: 'center', padding: space[8], fontSize: fontSize.sm },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: space[3],
    marginBottom: space[2],
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  title: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  body: { fontSize: fontSize.xs, marginTop: space[1] },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: space[2] },
})
