import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { fontSize, fontWeight, space } from '@/theme'

export function NetworkStatusBanner() {
  const { t } = useTranslation('common')
  const { isOffline } = useOnlineStatus()
  const insets = useSafeAreaInsets()

  if (!isOffline) return null

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, space[2]),
          paddingLeft: Math.max(insets.left + space[3], space[3]),
          paddingRight: Math.max(insets.right + space[3], space[3]),
        },
      ]}
    >
      <View style={styles.banner}>
        <Text style={styles.text}>{t('offline.title')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  banner: {
    alignSelf: 'center',
    maxWidth: 520,
    width: '100%',
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  text: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
})
