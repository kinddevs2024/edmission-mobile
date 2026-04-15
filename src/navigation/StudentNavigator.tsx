import { Platform } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { PlaceholderScreen } from '@/screens/PlaceholderScreen'
import { GlobalAccountProfileScreen } from '@/screens/common/GlobalAccountProfileScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { PaymentScreen } from '@/screens/common/PaymentScreen'
import { PaymentCancelScreen, PaymentSuccessScreen } from '@/screens/common/PaymentResultScreen'
import { SupportScreen } from '@/screens/common/SupportScreen'
import { SearchScreen } from '@/screens/student/SearchScreen'
import { StudentAIScreen } from '@/screens/student/StudentAIScreen'
import { StudentMoreScreen } from '@/screens/student/StudentMoreScreen'
import { StudentWebAppScreen } from '@/screens/student/StudentWebAppScreen'
import { PrivacyScreen } from '@/screens/common/PrivacyScreen'
import { useThemeColors } from '@/theme'
import type { StudentStackParamList } from '@/navigation/types'

const Stack = createStackNavigator<StudentStackParamList>()

export function StudentNavigator() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  return (
    <Stack.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        headerTintColor: c.primary,
        cardStyle: Platform.select({
          web: { flex: 1, height: '100%', backgroundColor: c.background },
          default: { backgroundColor: c.background },
        }),
      }}
    >
      <Stack.Screen name="StudentHome" component={StudentWebAppScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudentMore" component={StudentMoreScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ProfileGlobal" component={GlobalAccountProfileScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudentAI" component={StudentAIScreen} options={{ title: 'Edmission AI' }} />
      <Stack.Screen name="AIChat" component={PlaceholderScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Subscription' }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t('common:privacy') }} />
      <Stack.Screen name="Cookies" component={PlaceholderScreen} options={{ title: t('common:cookies', 'Cookies') }} />
    </Stack.Navigator>
  )
}
