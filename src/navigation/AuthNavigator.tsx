import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LandingScreen } from '@/screens/landing/LandingScreen'
import { LoginScreen } from '@/screens/auth/LoginScreen'
import { RegisterScreen } from '@/screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen'
import { VerifyEmailScreen } from '@/screens/auth/VerifyEmailScreen'
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen'
import { ChooseLanguageScreen } from '@/screens/auth/ChooseLanguageScreen'
import { YandexCallbackScreen } from '@/screens/auth/YandexCallbackScreen'
import { PlaceholderScreen } from '@/screens/PlaceholderScreen'
import { PrivacyScreen } from '@/screens/common/PrivacyScreen'
import { useThemeColors } from '@/theme'
import type { AuthStackParamList } from '@/navigation/types'

const Stack = createStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  return (
    <Stack.Navigator
      initialRouteName="ChooseLanguage"
      detachInactiveScreens={false}
      screenOptions={({ navigation, route }) => ({
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.background },
        headerLeftContainerStyle: styles.headerLeftWrap,
        headerLeft: ({ canGoBack }) =>
          route.name !== 'Landing' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => (canGoBack ? navigation.goBack() : navigation.navigate('Landing'))}
              style={({ pressed }) => [
                styles.backPill,
                { borderColor: c.border, backgroundColor: c.card },
                pressed && styles.backPillPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={17} color={c.textMuted} />
              <Text style={[styles.backLabel, { color: c.textMuted }]}>{t('common:back', 'Back')}</Text>
            </Pressable>
          ) : (
            <View />
          ),
        cardStyle: { backgroundColor: c.background },
      })}
    >
      <Stack.Screen name="ChooseLanguage" component={ChooseLanguageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Register', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="YandexCallback" component={YandexCallbackScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Cookies" component={PlaceholderScreen} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  headerLeftWrap: { paddingLeft: 12, paddingTop: 0 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  backPillPressed: { opacity: 0.85 },
  backLabel: { fontSize: 15, fontWeight: '600' },
})
