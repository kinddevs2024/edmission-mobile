import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStatusStore } from '@/store/appStatusStore'
import { colors } from '@/theme/colors'

export function MaintenanceScreen() {
  const { t } = useTranslation('common')
  const insets = useSafeAreaInsets()
  const setMaintenance = useAppStatusStore((s) => s.setMaintenance)

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <Text style={styles.title}>{t('maintenance.title')}</Text>
      <Text style={styles.desc}>{t('maintenance.description')}</Text>
      <Pressable style={styles.btn} onPress={() => setMaintenance(false)}>
        <Text style={styles.btnTxt}>{t('maintenance.retry', 'Try again')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
