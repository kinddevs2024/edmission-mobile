import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { changePassword, getApiError, getProfile, logout, updateProfile } from '@/services/auth'
import { disable2FA, setup2FA, verifyAndEnable2FA } from '@/services/twoFactor'
import { useAuth } from '@/hooks/useAuth'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

export function GlobalAccountProfileScreen() {
  const { t } = useTranslation(['common', 'auth'])
  const c = useThemeColors()
  const { user, setUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [telegram, setTelegram] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [facebook, setFacebook] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [emailApp, setEmailApp] = useState(true)
  const [emailTrial, setEmailTrial] = useState(true)

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const [twoFaSetup, setTwoFaSetup] = useState<{ secret: string; qrUrl: string } | null>(null)
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaBusy, setTwoFaBusy] = useState(false)
  const [disableCode, setDisableCode] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const u = await getProfile()
      setName(u.name ?? '')
      setPhone(u.phone ?? '')
      setTelegram(u.socialLinks?.telegram ?? '')
      setInstagram(u.socialLinks?.instagram ?? '')
      setLinkedin(u.socialLinks?.linkedin ?? '')
      setFacebook(u.socialLinks?.facebook ?? '')
      setWhatsapp(u.socialLinks?.whatsapp ?? '')
      setEmailApp(u.notificationPreferences?.emailApplicationUpdates !== false)
      setEmailTrial(u.notificationPreferences?.emailTrialReminder !== false)
    } catch {
      /* keep fields */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onSaveProfile = async () => {
    setSaving(true)
    try {
      const u = await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        socialLinks: {
          telegram: telegram.trim() || undefined,
          instagram: instagram.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          facebook: facebook.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        },
        notificationPreferences: {
          emailApplicationUpdates: emailApp,
          emailTrialReminder: emailTrial,
        },
      })
      setUser(u)
      Alert.alert(t('common:success'), t('common:updated'))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async () => {
    if (!newPw || newPw !== confirmPw) {
      Alert.alert(t('common:error'), t('auth:passwordsMustMatch', 'Passwords do not match'))
      return
    }
    setPwBusy(true)
    try {
      await changePassword(curPw, newPw)
      setCurPw('')
      setNewPw('')
      setConfirmPw('')
      Alert.alert(t('common:success'), t('common:updated'))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setPwBusy(false)
    }
  }

  const onStart2FA = async () => {
    setTwoFaBusy(true)
    try {
      const res = await setup2FA()
      setTwoFaSetup(res)
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setTwoFaBusy(false)
    }
  }

  const onVerify2FA = async () => {
    if (!twoFaCode.trim()) return
    setTwoFaBusy(true)
    try {
      await verifyAndEnable2FA(twoFaCode.trim())
      setTwoFaSetup(null)
      setTwoFaCode('')
      const u = await getProfile()
      setUser(u)
      Alert.alert(t('common:success'), t('common:twoFaEnabled'))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setTwoFaBusy(false)
    }
  }

  const onDisable2FA = async () => {
    if (!disableCode.trim()) return
    setTwoFaBusy(true)
    try {
      await disable2FA(disableCode.trim())
      setDisableCode('')
      const u = await getProfile()
      setUser(u)
      Alert.alert(t('common:success'), t('common:updated'))
    } catch (e) {
      Alert.alert(t('common:error'), getApiError(e).message)
    } finally {
      setTwoFaBusy(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  const totpOn = user?.totpEnabled

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h2, { color: c.text }]}>{t('common:account')}</Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>{user?.email}</Text>

        <Text style={[styles.label, { color: c.textMuted }]}>{t('common:name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
          placeholderTextColor={c.textMuted}
        />

        <Text style={[styles.label, { color: c.textMuted }]}>{t('university:phone', 'Phone')}</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: c.border, color: c.text }]}
          placeholderTextColor={c.textMuted}
        />

        <Text style={[styles.h3, { color: c.text }]}>{t('common:notificationPreferences')}</Text>
        <View style={[styles.rowBetween, { borderColor: c.border }]}>
          <Text style={{ color: c.text, flex: 1 }}>{t('common:emailApplicationUpdates')}</Text>
          <Switch value={emailApp} onValueChange={setEmailApp} />
        </View>
        <View style={[styles.rowBetween, { borderColor: c.border }]}>
          <Text style={{ color: c.text, flex: 1 }}>{t('common:emailTrialReminder')}</Text>
          <Switch value={emailTrial} onValueChange={setEmailTrial} />
        </View>

        <Text style={[styles.h3, { color: c.text }]}>Social</Text>
        {(
          [
            ['Telegram', telegram, setTelegram],
            ['Instagram', instagram, setInstagram],
            ['LinkedIn', linkedin, setLinkedin],
            ['Facebook', facebook, setFacebook],
            ['WhatsApp', whatsapp, setWhatsapp],
          ] as const
        ).map(([label, val, set]) => (
          <View key={label}>
            <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
            <TextInput
              value={val}
              onChangeText={set}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
            />
          </View>
        ))}

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: c.primary }]}
          onPress={() => void onSaveProfile()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={[styles.primaryBtnTxt, { color: c.onPrimary }]}>{t('common:save')}</Text>
          )}
        </Pressable>

        <Text style={[styles.h3, { color: c.text }]}>{t('auth:changePassword', 'Change password')}</Text>
        <TextInput
          value={curPw}
          onChangeText={setCurPw}
          secureTextEntry
          placeholder={t('auth:currentPassword')}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />
        <TextInput
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry
          placeholder={t('auth:newPassword')}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />
        <TextInput
          value={confirmPw}
          onChangeText={setConfirmPw}
          secureTextEntry
          placeholder={t('auth:confirmPassword', 'Confirm password')}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />
        <Pressable
          style={[styles.secondaryBtn, { borderColor: c.primary }]}
          onPress={() => void onChangePassword()}
          disabled={pwBusy}
        >
          <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('auth:changePassword', 'Change password')}</Text>
        </Pressable>

        <Text style={[styles.h3, { color: c.text }]}>{t('common:twoFactorTitle')}</Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>{t('common:twoFactorHint')}</Text>
        {totpOn ? (
          <>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('common:enter2FAToDisable')}</Text>
            <TextInput
              value={disableCode}
              onChangeText={setDisableCode}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholderTextColor={c.textMuted}
              keyboardType="number-pad"
            />
            <Pressable
              style={[styles.secondaryBtn, { borderColor: c.danger }]}
              onPress={() => void onDisable2FA()}
              disabled={twoFaBusy}
            >
              <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:disable2FA')}</Text>
            </Pressable>
          </>
        ) : twoFaSetup ? (
          <>
            <Text style={[styles.meta, { color: c.text }]} selectable>
              {twoFaSetup.secret}
            </Text>
            {twoFaSetup.qrUrl ? (
              <Pressable onPress={() => void Linking.openURL(twoFaSetup.qrUrl)}>
                <Text style={{ color: c.primary, marginVertical: 8 }}>{t('common:open')}</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.label, { color: c.textMuted }]}>{t('common:verificationCode')}</Text>
            <TextInput
              value={twoFaCode}
              onChangeText={setTwoFaCode}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholderTextColor={c.textMuted}
              keyboardType="number-pad"
            />
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: c.primary }]}
              onPress={() => void onVerify2FA()}
              disabled={twoFaBusy}
            >
              <Text style={[styles.primaryBtnTxt, { color: c.onPrimary }]}>{t('common:verifyAndEnable')}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.secondaryBtn, { borderColor: c.primary }]}
            onPress={() => void onStart2FA()}
            disabled={twoFaBusy}
          >
            <Text style={{ color: c.primary, fontWeight: fontWeight.semibold }}>{t('common:enable2FA')}</Text>
          </Pressable>
        )}

        <Pressable style={[styles.logout, { borderColor: c.danger }]} onPress={() => void logout()}>
          <Text style={{ color: c.danger, fontWeight: fontWeight.semibold }}>{t('common:logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: space[4], paddingBottom: space[10] },
  h2: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: space[1] },
  h3: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: space[6], marginBottom: space[2] },
  meta: { fontSize: fontSize.sm, marginBottom: space[4] },
  label: { fontSize: fontSize.xs, marginBottom: space[1], marginTop: space[2] },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    fontSize: fontSize.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space[3],
  },
  primaryBtn: {
    marginTop: space[4],
    paddingVertical: space[3],
    borderRadius: radii.md,
    alignItems: 'center',
  },
  primaryBtnTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  secondaryBtn: {
    marginTop: space[2],
    paddingVertical: space[3],
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  logout: {
    marginTop: space[8],
    paddingVertical: space[3],
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
})
