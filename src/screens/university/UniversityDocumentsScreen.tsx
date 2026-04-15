import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { getDocumentTemplates, listIssuedDocuments, updateDocumentTemplate } from '@/services/universityDocuments'
import type { DocumentTemplate, UniversityDocumentSummary } from '@/types/documentModule'
import { getApiError } from '@/services/auth'
import type { UniversityStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityStackParamList, 'UniversityDocuments'>

type Tab = 'templates' | 'sent'

export function UniversityDocumentsScreen({ navigation }: Props) {
  const { t } = useTranslation(['common', 'documents'])
  const c = useThemeColors()
  const [tab, setTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [issued, setIssued] = useState<UniversityDocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [tmpl, doc] = await Promise.all([getDocumentTemplates(), listIssuedDocuments()])
      setTemplates(tmpl)
      setIssued(doc)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const archive = (tpl: DocumentTemplate) => {
    void updateDocumentTemplate(tpl.id, { status: 'archived' })
      .then(() => load())
      .catch((e) => Alert.alert(t('common:error'), getApiError(e).message))
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'templates' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('templates')}
        >
          <Text style={{ color: c.text }}>{t('documents:universityDocuments.tabs.templates')}</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'sent' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('sent')}
        >
          <Text style={{ color: c.text }}>{t('documents:universityDocuments.tabs.sent')}</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ color: c.danger, padding: space[3] }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === 'templates' ? (
            <>
              <Pressable
                style={[styles.create, { borderColor: c.primary }]}
                onPress={() => navigation.navigate('DocumentTemplateEditorNew')}
              >
                <Text style={{ color: c.primary }}>+ {t('documents:universityDocuments.createTemplate', 'Create template')}</Text>
              </Pressable>
              {templates.map((tpl) => (
                <Pressable
                  key={tpl.id}
                  onPress={() => navigation.navigate('DocumentTemplateEditor', { id: tpl.id })}
                  style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}
                >
                  <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{tpl.name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>
                    {tpl.type} · {tpl.status}
                  </Text>
                  {tpl.status !== 'archived' ? (
                    <Pressable onPress={() => archive(tpl)} style={{ marginTop: space[2] }}>
                      <Text style={{ color: c.danger, fontSize: fontSize.xs }}>{t('common:remove', 'Archive')}</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              ))}
              {templates.length === 0 ? (
                <Text style={{ color: c.textMuted }}>{t('documents:universityDocuments.noTemplatesYet')}</Text>
              ) : null}
            </>
          ) : (
            <>
              {issued.map((doc) => (
                <View key={doc.id} style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
                  <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{doc.title ?? doc.type}</Text>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{doc.status}</Text>
                  {doc.student?.fullName ? (
                    <Text style={{ color: c.text, fontSize: fontSize.sm, marginTop: 4 }}>{doc.student.fullName}</Text>
                  ) : null}
                </View>
              ))}
              {issued.length === 0 ? (
                <Text style={{ color: c.textMuted }}>{t('documents:universityDocuments.noSentDocumentsYet')}</Text>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' },
  tab: { flex: 1, paddingVertical: space[3], alignItems: 'center' },
  scroll: { padding: space[4], gap: space[2], paddingBottom: space[10] },
  card: { borderWidth: 1, borderRadius: radii.md, padding: space[3] },
  create: { borderWidth: 1, borderRadius: radii.md, padding: space[3], alignItems: 'center', marginBottom: space[2] },
})
