import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { createStudent, listMyStudents, type CounsellorStudent } from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import type { SchoolStackParamList, SchoolTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SchoolTabParamList, 'CounsellorStudents'>,
  StackNavigationProp<SchoolStackParamList>
>

const LIMIT = 30

export function CounsellorStudentsScreen() {
  const { t } = useTranslation(['school', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()
  const [list, setList] = useState<CounsellorStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFirst, setNewFirst] = useState('')
  const [newLast, setNewLast] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(t0)
  }, [search])

  const load = useCallback(
    async (p: number, reset: boolean) => {
      setError('')
      try {
        const res = await listMyStudents({ page: p, limit: LIMIT, search: debounced || undefined })
        setTotal(res.total ?? 0)
        setList((prev) => (reset ? res.data ?? [] : [...prev, ...(res.data ?? [])]))
        setPage(p)
      } catch (e) {
        setError(getApiError(e).message)
        if (reset) setList([])
      }
    },
    [debounced]
  )

  useEffect(() => {
    setLoading(true)
    void load(1, true).finally(() => setLoading(false))
  }, [debounced, load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(1, true)
    setRefreshing(false)
  }

  const loadMore = () => {
    if (loading || list.length >= total) return
    void load(page + 1, false)
  }

  const displayName = (s: CounsellorStudent) =>
    [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.email || '—'

  const submitCreate = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    setCreating(true)
    try {
      const res = await createStudent({
        email,
        firstName: newFirst.trim() || undefined,
        lastName: newLast.trim() || undefined,
      })
      setModalOpen(false)
      setNewEmail('')
      setNewFirst('')
      setNewLast('')
      Alert.alert(t('school:studentCreatedTitle'), t('school:studentCreatedBody', { password: res.temporaryPassword }))
      await load(1, true)
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <View style={styles.headerRow}>
        <Text style={[styles.h1, { color: c.text, flex: 1 }]}>{t('school:myStudents')}</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={() => setModalOpen(true)}>
          <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('school:addStudent')}</Text>
        </Pressable>
      </View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('school:searchStudentsPlaceholder')}
        placeholderTextColor={c.textMuted}
        style={[styles.search, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
      />
      {error ? <Text style={{ color: c.danger, marginBottom: space[2] }}>{error}</Text> : null}

      <FlatList
        data={list}
        keyExtractor={(item) => item.userId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: space[6] }} />
          ) : (
            <Text style={{ color: c.textMuted, marginTop: space[4] }}>{t('school:noStudentsYet')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderColor: c.border }]}
            onPress={() => navigation.navigate('CounsellorStudentProfile', { studentId: item.userId })}
          >
            <Text style={{ color: c.text, fontWeight: fontWeight.medium }}>{displayName(item)}</Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>{item.email}</Text>
            {item.mustChangePassword ? (
              <Text style={{ color: c.warning, fontSize: fontSize.xs, marginTop: 4 }}>{t('school:mustChangePasswordBadge')}</Text>
            ) : null}
          </Pressable>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => !creating && setModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{t('school:addStudent')}</Text>
            <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: space[3] }}>
              {t('school:addStudentHint')}
            </Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="email@school.edu"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={newFirst}
              onChangeText={setNewFirst}
              placeholder={t('school:firstNameOptional')}
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={newLast}
              onChangeText={setNewLast}
              placeholder={t('school:lastNameOptional')}
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => !creating && setModalOpen(false)} style={styles.modalCancel}>
                <Text style={{ color: c.textMuted }}>{t('common:cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalOk, { backgroundColor: c.primary, opacity: creating ? 0.7 : 1 }]}
                onPress={() => void submitCreate()}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={c.onPrimary} />
                ) : (
                  <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:create')}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space[4] },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space[2], marginTop: space[2] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  addBtn: { paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radii.md },
  search: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3], fontSize: fontSize.sm },
  row: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2] },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: space[4],
  },
  modalCard: { borderRadius: radii.lg, borderWidth: 1, padding: space[4] },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: space[1] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[2], fontSize: fontSize.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space[3], marginTop: space[2] },
  modalCancel: { padding: space[3] },
  modalOk: { paddingHorizontal: space[4], paddingVertical: space[3], borderRadius: radii.md, minWidth: 100, alignItems: 'center' },
})
