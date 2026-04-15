import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import type { StudentStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<StudentStackParamList, 'StudentMore'>

type Row =
  | { kind: 'web'; path: string; labelKey: string; labelDefault: string }
  | { kind: 'stack'; name: keyof StudentStackParamList; params?: object; labelKey: string; labelDefault: string }

const ROWS: Row[] = [
  { kind: 'web', path: '/student/documents', labelKey: 'navDocuments', labelDefault: 'Documents' },
  { kind: 'web', path: '/student/schools', labelKey: 'navMySchool', labelDefault: 'My school' },
  { kind: 'web', path: '/student/offers', labelKey: 'navOffers', labelDefault: 'Offers' },
  { kind: 'web', path: '/student/compare', labelKey: 'navCompare', labelDefault: 'Compare' },
  { kind: 'web', path: '/student/ai', labelKey: 'navEdmissionAi', labelDefault: 'Edmission AI' },
  { kind: 'stack', name: 'Notifications', labelKey: 'navNotifications', labelDefault: 'Notifications' },
  { kind: 'stack', name: 'ProfileGlobal', labelKey: 'navProfile', labelDefault: 'Account profile' },
  { kind: 'stack', name: 'Search', labelKey: 'search', labelDefault: 'Search' },
  { kind: 'stack', name: 'StudentAI', labelKey: 'navEdmissionAi', labelDefault: 'AI (native)' },
  { kind: 'stack', name: 'Payment', labelKey: 'navSubscription', labelDefault: 'Subscription' },
  { kind: 'stack', name: 'Support', params: {}, labelKey: 'navSupport', labelDefault: 'Support' },
  { kind: 'web', path: '/privacy', labelKey: 'privacy', labelDefault: 'Privacy' },
  { kind: 'web', path: '/cookies', labelKey: 'cookies', labelDefault: 'Cookies' },
]

function navigateStack(
  navigation: StackNavigationProp<StudentStackParamList>,
  name: keyof StudentStackParamList,
  params?: object
) {
  // Params differ per screen; rows are curated below.
  ;(navigation.navigate as (sn: string, p?: object) => void)(name, params)
}

export function StudentMoreScreen({ navigation }: Props) {
  const { t } = useTranslation('student')
  const c = useThemeColors()

  return (
    <View style={[styles.wrap, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>{t('moreScreens', 'All student routes')}</Text>
      <FlatList
        data={ROWS}
        keyExtractor={(item, i) => `${item.kind}-${i}`}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderBottomColor: c.border, backgroundColor: c.card }]}
            onPress={() => {
              if (item.kind === 'web') {
                navigation.navigate('StudentHome', { path: item.path })
              } else {
                navigateStack(navigation, item.name, item.params)
              }
            }}
          >
            <Text style={[styles.rowText, { color: c.text }]}>{t(item.labelKey, item.labelDefault)}</Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, padding: space[4] },
  row: {
    paddingVertical: space[3.5],
    paddingHorizontal: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { fontSize: fontSize.base },
})
