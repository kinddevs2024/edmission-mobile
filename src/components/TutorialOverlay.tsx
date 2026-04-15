import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { getApiError, updateProfile } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export type TutorialRole = 'student' | 'university'

export interface TutorialOverlayProps {
  role: TutorialRole
  visible: boolean
  onFinished: () => void
}

const SLIDE_COUNT = 5

export function TutorialOverlay({ role, visible, onFinished }: TutorialOverlayProps) {
  const ns = role === 'student' ? 'student' : 'university'
  const { t } = useTranslation(ns)
  const { t: tc } = useTranslation('common')
  const c = useThemeColors()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (visible) setStep(0)
  }, [visible])

  const slides = useMemo(
    () =>
      Array.from({ length: SLIDE_COUNT }, (_, i) => {
        const n = i + 1
        return {
          title: t(`tutorial.slide${n}Title`),
          body: t(`tutorial.slide${n}Body`),
        }
      }),
    [t]
  )

  const persistSeen = useCallback(async () => {
    if (!user) return
    const key = role === 'student' ? 'student' : 'university'
    await updateProfile({
      onboardingTutorialSeen: {
        ...user.onboardingTutorialSeen,
        [key]: true,
      },
    })
  }, [user, role])

  const finish = useCallback(async () => {
    setBusy(true)
    try {
      await persistSeen()
      onFinished()
    } catch (e) {
      console.warn(getApiError(e).message)
    } finally {
      setBusy(false)
    }
  }, [persistSeen, onFinished])

  const onSkip = useCallback(() => {
    void finish()
  }, [finish])

  const onNext = useCallback(() => {
    if (step >= SLIDE_COUNT - 1) {
      void finish()
      return
    }
    setStep((s) => s + 1)
  }, [step, finish])

  const onBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  if (!visible) return null

  const { title, body } = slides[step] ?? slides[0]

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSkip} accessibilityRole="button" />
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} pointerEvents="box-none">
          <Text style={[styles.welcome, { color: c.primary }]}>{t('tutorial.welcome')}</Text>
          <Text style={[styles.progress, { color: c.textMuted }]}>
            {tc('tutorialProgress', { current: step + 1, total: SLIDE_COUNT })}
          </Text>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.body, { color: c.textMuted }]}>{body}</Text>
          <View style={styles.row}>
            {step > 0 ? (
              <Pressable
                onPress={onBack}
                style={[styles.btnGhost, { borderColor: c.border }]}
                disabled={busy}
              >
                <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{tc('prev')}</Text>
              </Pressable>
            ) : (
              <View style={styles.btnGhost} />
            )}
            <Pressable onPress={onSkip} disabled={busy}>
              <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{tc('tutorialSkip')}</Text>
            </Pressable>
            <Pressable
              onPress={onNext}
              style={[styles.btnPrimary, { backgroundColor: c.primary }]}
              disabled={busy}
            >
              <Text style={{ color: c.onPrimary, fontWeight: fontWeight.semibold }}>
                {step >= SLIDE_COUNT - 1 ? tc('tutorialDone') : tc('next')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: space[4],
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: space[5],
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  welcome: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: space[2] },
  progress: { fontSize: fontSize.xs, marginBottom: space[3] },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: space[2] },
  body: { fontSize: fontSize.sm, lineHeight: 22, marginBottom: space[5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  btnGhost: {
    minWidth: 88,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnPrimary: {
    minWidth: 100,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    borderRadius: radii.md,
    alignItems: 'center',
  },
})
