import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getApiError, getProfile } from '@/services/auth'
import { createCheckoutSession } from '@/services/payment'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

const STUDENT_PLANS = [
  { id: 'student_free_trial', name: 'Free Trial', apps: '3 applications', period: '14 days', chat: 'DeepSeek', highlight: false },
  { id: 'student_standard', name: 'Standard', apps: '15 applications', period: '—', chat: 'DeepSeek v16', highlight: true },
  { id: 'student_max_premium', name: 'Max Premium', apps: 'Unlimited', period: '—', chat: 'ChatGPT-4', highlight: false },
]

const UNIVERSITY_PLANS = [
  { id: 'university_free', name: 'Free', requests: '15 student requests', chat: 'Basic', highlight: false },
  { id: 'university_premium', name: 'Premium', requests: 'Unlimited', chat: 'ChatGPT-4', highlight: true },
]

export function PaymentScreen() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sub = user?.subscription
  const isStudent = user?.role === 'student'
  const isUniversity = user?.role === 'university'

  useEffect(() => {
    if (user && !user.subscription) {
      setLoading(true)
      void getProfile().finally(() => setLoading(false))
    }
  }, [user?.id, user?.subscription])

  const handleUpgrade = async (planId: string) => {
    setError('')
    setCheckoutLoading(planId)
    try {
      const successUrl = Linking.createURL('PaymentSuccess')
      const cancelUrl = Linking.createURL('PaymentCancel')
      const url = await createCheckoutSession(planId, successUrl, cancelUrl)
      await WebBrowser.openBrowserAsync(url)
    } catch (err) {
      setError(getApiError(err).message)
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (!user || (!isStudent && !isUniversity)) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
        <Text style={[styles.hint, { color: c.textMuted }]}>{t('common:subscriptionPlansHint')}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: c.text }]}>{t('common:subscriptionAndPayment')}</Text>
        {error ? (
          <View style={[styles.errBox, { borderColor: c.danger }]}>
            <Text style={{ color: c.danger, fontSize: fontSize.sm }}>{error}</Text>
          </View>
        ) : null}

        {sub ? (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('common:currentPlan')}</Text>
            <Text style={{ color: c.text, marginTop: 8 }}>{sub.plan.replace(/_/g, ' ')}</Text>
            {sub.trialEndsAt ? (
              <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>{sub.trialEndsAt}</Text>
            ) : null}
            {isStudent && sub.applicationLimit != null ? (
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>
                {sub.applicationCurrent} / {sub.applicationLimit} applications
              </Text>
            ) : null}
            {isUniversity && sub.offerLimit != null ? (
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>
                {sub.offerCurrent} / {sub.offerLimit} requests
              </Text>
            ) : null}
          </View>
        ) : null}

        {loading && !sub ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <>
            {isStudent
              ? STUDENT_PLANS.map((plan) => (
                  <View
                    key={plan.id}
                    style={[
                      styles.card,
                      { backgroundColor: c.card, borderColor: plan.highlight ? c.primary : c.border, borderWidth: plan.highlight ? 2 : 1 },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: c.text }]}>{plan.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 6 }}>{plan.apps}</Text>
                    <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>Period: {plan.period}</Text>
                    <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>Chat: {plan.chat}</Text>
                    <Pressable
                      style={[styles.btn, { backgroundColor: c.primary }]}
                      onPress={() => void handleUpgrade(plan.id)}
                      disabled={checkoutLoading != null}
                    >
                      {checkoutLoading === plan.id ? (
                        <ActivityIndicator color={c.onPrimary} />
                      ) : (
                        <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:upgrade')}</Text>
                      )}
                    </Pressable>
                  </View>
                ))
              : null}
            {isUniversity
              ? UNIVERSITY_PLANS.map((plan) => (
                  <View
                    key={plan.id}
                    style={[
                      styles.card,
                      { backgroundColor: c.card, borderColor: plan.highlight ? c.primary : c.border, borderWidth: plan.highlight ? 2 : 1 },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: c.text }]}>{plan.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: fontSize.sm, marginTop: 6 }}>{plan.requests}</Text>
                    <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>Chat: {plan.chat}</Text>
                    <Pressable
                      style={[styles.btn, { backgroundColor: c.primary }]}
                      onPress={() => void handleUpgrade(plan.id)}
                      disabled={checkoutLoading != null}
                    >
                      {checkoutLoading === plan.id ? (
                        <ActivityIndicator color={c.onPrimary} />
                      ) : (
                        <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>{t('common:upgrade')}</Text>
                      )}
                    </Pressable>
                  </View>
                ))
              : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h1: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[4] },
  hint: { padding: space[4], fontSize: fontSize.sm },
  errBox: { borderWidth: 1, borderRadius: radii.md, padding: space[3], marginBottom: space[3] },
  card: { borderRadius: radii.md, padding: space[4], marginBottom: space[3] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  btn: { marginTop: space[4], paddingVertical: space[3], borderRadius: radii.md, alignItems: 'center' },
})
