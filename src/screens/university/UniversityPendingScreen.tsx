import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getProfile as refreshAuthProfile, logout } from '@/services/auth'
import type { UniversityGateStackParamList } from '@/navigation/types'
import { fontSize, fontWeight, space, useThemeColors } from '@/theme'

type Props = StackScreenProps<UniversityGateStackParamList, 'UniversityPendingVerification'>

export function UniversityPendingScreen({ navigation }: Props) {
  const { t } = useTranslation(['university', 'common'])
  const c = useThemeColors()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshAuthProfile()
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refreshAuthProfile()
        .then((u) => {
          if (!u.universityProfile) {
            navigation.replace('UniversitySelect')
          }
        })
        .catch(() => {})
    }, [navigation])
  )

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <Text style={[styles.h1, { color: c.text }]}>{t('university:pendingTitle', 'Account under review')}</Text>
        <Text style={[styles.p, { color: c.textMuted }]}>
          {t(
            'university:pendingBody',
            'Your university account will be verified by our team. You will be notified when it is active.'
          )}
        </Text>
        {user?.email ? (
          <Text style={[styles.meta, { color: c.textMuted }]}>{user.email}</Text>
        ) : null}
        <Pressable style={[styles.btn, { borderColor: c.border }]} onPress={() => navigation.navigate('UniversitySelect')}>
          <Text style={{ color: c.primary }}>{t('university:selectUniversity', 'Select university')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, { borderColor: c.danger }]} onPress={() => void logout()}>
          <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[6], gap: space[4] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  p: { fontSize: fontSize.sm, lineHeight: 22 },
  meta: { fontSize: fontSize.xs },
  btn: { paddingVertical: space[3], borderRadius: 12, borderWidth: 1, alignItems: 'center', marginTop: space[2] },
})
