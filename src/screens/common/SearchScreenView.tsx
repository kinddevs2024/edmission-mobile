import { useEffect, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'
import type { SearchUniversityItem, SearchStudentItem, SearchChatMessageItem } from '@/services/search'

export type SearchScreenHookSlice = {
  value: string
  setValue: (v: string) => void
  debounced: string
  result: {
    universities: SearchUniversityItem[]
    students: SearchStudentItem[]
    chatMessages?: SearchChatMessageItem[]
  } | null
  loading: boolean
  sitePages: Array<{ labelKey: string; navigate: (n: never) => void }>
  chatMessages: SearchChatMessageItem[]
  reset: () => void
  handleSelectUniversity: (id: string) => void
  handleSelectStudent: (id: string) => void
  handleSelectSitePage: (run: (nav: never) => void) => void
  handleSelectChatMessage: (chatId: string) => void
  handleSearchWithAI: () => void
}

type SectionRow =
  | { type: 'page'; labelKey: string; onPress: () => void }
  | { type: 'uni'; item: SearchUniversityItem }
  | { type: 'student'; item: SearchStudentItem }
  | { type: 'chat'; item: SearchChatMessageItem }

type Section = { title: string; data: SectionRow[] }

type Props = {
  navigation: { goBack: () => void }
  initialQuery?: string
  showStudents: boolean
  hook: SearchScreenHookSlice
}

export function SearchScreenView({ navigation, initialQuery, showStudents, hook }: Props) {
  const { t } = useTranslation(['common', 'student', 'university', 'school'])
  const c = useThemeColors()
  const seeded = useRef(false)

  const {
    value,
    setValue,
    debounced,
    result,
    loading,
    sitePages,
    chatMessages,
    reset,
    handleSelectUniversity,
    handleSelectStudent,
    handleSelectSitePage,
    handleSelectChatMessage,
    handleSearchWithAI,
  } = hook

  useEffect(() => {
    if (initialQuery != null && initialQuery !== '' && !seeded.current) {
      seeded.current = true
      setValue(initialQuery)
    }
  }, [initialQuery, setValue])

  const trans = (labelKey: string) => {
    const [ns, key] = labelKey.includes(':') ? labelKey.split(':') : ['common', labelKey]
    return t(`${ns}:${key}` as 'common:search')
  }

  const sections = useMemo((): Section[] => {
    if (!debounced.trim() || loading || !result) return []
    const out: Section[] = []
    if (sitePages.length > 0) {
      out.push({
        title: t('common:search'),
        data: sitePages.map((p) => ({
          type: 'page' as const,
          labelKey: p.labelKey,
          onPress: () => handleSelectSitePage(p.navigate as (nav: never) => void),
        })),
      })
    }
    if (result.universities.length > 0) {
      out.push({
        title: t('common:searchSectionUniversities'),
        data: result.universities.map((item) => ({ type: 'uni' as const, item })),
      })
    }
    if (showStudents && result.students.length > 0) {
      out.push({
        title: t('common:searchSectionStudents'),
        data: result.students.map((item) => ({ type: 'student' as const, item })),
      })
    }
    if (chatMessages.length > 0) {
      out.push({
        title: t('common:chat'),
        data: chatMessages.map((item) => ({ type: 'chat' as const, item })),
      })
    }
    return out
  }, [
    debounced,
    loading,
    result,
    sitePages,
    chatMessages,
    showStudents,
    t,
    handleSelectSitePage,
  ])

  const showList = debounced.trim() && !loading && sections.length > 0
  const showEmpty = debounced.trim() && !loading && sections.length === 0

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.toolbar, { borderBottomColor: c.border, backgroundColor: c.card }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: c.border + '33',
              borderColor: c.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={c.primary} style={styles.inputIcon} />
          ) : (
            <Ionicons name="search" size={20} color={c.primary} style={styles.inputIcon} />
          )}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={t('common:searchPlaceholder')}
            placeholderTextColor={c.textMuted}
            style={[styles.input, { color: c.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            autoFocus
          />
          {value ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common:clear')}
              onPress={() => reset()}
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={22} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!debounced.trim() ? (
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('common:searchHint')}</Text>
      ) : loading ? (
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('common:searchSearching')}</Text>
      ) : showList ? (
        <SectionList
          sections={sections}
          keyExtractor={(row, index) => {
            if (row.type === 'page') return `p-${row.labelKey}-${index}`
            if (row.type === 'uni') return `u-${row.item.id}`
            if (row.type === 'student') return `s-${row.item.id}`
            return `c-${row.item.id}`
          }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionTitle, { color: c.primary }]}>{title}</Text>
          )}
          renderItem={({ item: row }) => {
            if (row.type === 'page') {
              return (
                <Pressable style={[styles.row, { borderBottomColor: c.border }]} onPress={row.onPress}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>{trans(row.labelKey)}</Text>
                </Pressable>
              )
            }
            if (row.type === 'uni') {
              const u = row.item
              const sub = [u.city, u.country].filter(Boolean).join(', ')
              return (
                <Pressable
                  style={[styles.row, { borderBottomColor: c.border }]}
                  onPress={() => handleSelectUniversity(u.id)}
                >
                  <Text style={[styles.rowTitle, { color: c.text }]}>{u.name}</Text>
                  {sub ? <Text style={[styles.rowSub, { color: c.textMuted }]}>{sub}</Text> : null}
                </Pressable>
              )
            }
            if (row.type === 'student') {
              const s = row.item
              const name = [s.firstName, s.lastName].filter(Boolean).join(' ')
              const sub = [s.city, s.country].filter(Boolean).join(', ')
              return (
                <Pressable
                  style={[styles.row, { borderBottomColor: c.border }]}
                  onPress={() => handleSelectStudent(s.id)}
                >
                  <Text style={[styles.rowTitle, { color: c.text }]}>{name || '—'}</Text>
                  {sub ? <Text style={[styles.rowSub, { color: c.textMuted }]}>{sub}</Text> : null}
                </Pressable>
              )
            }
            const m = row.item
            return (
              <Pressable
                style={[styles.row, { borderBottomColor: c.border }]}
                onPress={() => handleSelectChatMessage(m.chatId)}
              >
                <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={2}>
                  {m.text}
                </Text>
              </Pressable>
            )
          }}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      ) : showEmpty ? (
        <ScrollView contentContainerStyle={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('common:searchNoResults')}</Text>
          <Pressable style={[styles.aiBtn, { backgroundColor: c.primary }]} onPress={handleSearchWithAI}>
            <Text style={[styles.aiBtnText, { color: c.onPrimary }]}>{t('common:searchWithAI')}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: space[2] },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 2,
  },
  inputIcon: { marginRight: space[2] },
  input: { flex: 1, fontSize: fontSize.base, paddingVertical: space[1] },
  hint: { textAlign: 'center', padding: space[8], fontSize: fontSize.sm },
  listContent: { paddingBottom: space[8] },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[1],
  },
  row: {
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  rowSub: { fontSize: fontSize.xs, marginTop: space[1] },
  emptyWrap: { padding: space[8], alignItems: 'center', gap: space[4] },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center' },
  aiBtn: {
    paddingVertical: space[3],
    paddingHorizontal: space[6],
    borderRadius: radii.full,
    minWidth: 200,
    alignItems: 'center',
  },
  aiBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
})
