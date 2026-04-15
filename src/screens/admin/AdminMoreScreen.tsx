import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import type { AdminStackParamList, AdminTabParamList } from '@/navigation/types'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList, 'AdminMore'>,
  StackNavigationProp<AdminStackParamList>
>

export function AdminMoreScreen() {
  const { t } = useTranslation(['admin', 'common'])
  const c = useThemeColors()
  const navigation = useNavigation<Nav>()

  const go = (key: keyof AdminStackParamList) => {
    if (key === 'Support') navigation.navigate('Support', {})
    else navigation.navigate(key as never)
  }

  const rows: Array<{ key: keyof AdminStackParamList; label: string }> = [
    { key: 'AdminChats', label: t('admin:allChats') },
    { key: 'AdminTickets', label: t('admin:mobileTicketsTitle') },
    { key: 'AdminHealth', label: t('admin:mobileHealthScreenTitle') },
    { key: 'Notifications', label: t('common:notifications') },
    { key: 'ProfileGlobal', label: t('common:account') },
    { key: 'Support', label: t('admin:support') },
  ]

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <Text style={[styles.h1, { color: c.text }]}>{t('admin:mobileMoreTitle')}</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {rows.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.row, { borderBottomColor: c.border }]}
            onPress={() => go(item.key)}
          >
            <Text style={{ color: c.text, fontSize: fontSize.md }}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, paddingHorizontal: space[4], marginTop: space[2], marginBottom: space[2] },
  scroll: { paddingBottom: space[10] },
  row: { paddingVertical: space[4], paddingHorizontal: space[4], borderBottomWidth: StyleSheet.hairlineWidth },
})
