import type { ComponentType } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { GlobalAccountProfileScreen } from '@/screens/common/GlobalAccountProfileScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { PaymentScreen } from '@/screens/common/PaymentScreen'
import { PaymentCancelScreen, PaymentSuccessScreen } from '@/screens/common/PaymentResultScreen'
import { PrivacyScreen } from '@/screens/common/PrivacyScreen'
import { SupportScreen } from '@/screens/common/SupportScreen'
import { PlaceholderScreen } from '@/screens/PlaceholderScreen'
import { AdminChatDetailScreen } from '@/screens/admin/AdminChatDetailScreen'
import { AdminChatsScreen } from '@/screens/admin/AdminChatsScreen'
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen'
import { AdminHealthScreen } from '@/screens/admin/AdminHealthScreen'
import { AdminMoreScreen } from '@/screens/admin/AdminMoreScreen'
import { AdminTicketDetailScreen } from '@/screens/admin/AdminTicketDetailScreen'
import { AdminTicketsScreen } from '@/screens/admin/AdminTicketsScreen'
import { AdminUniversityRequestsScreen } from '@/screens/admin/AdminUniversityRequestsScreen'
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen'
import { AdminVerificationScreen } from '@/screens/admin/AdminVerificationScreen'
import { useThemeColors } from '@/theme'
import type { AdminStackParamList, AdminTabParamList } from '@/navigation/types'

const AppStack = createStackNavigator<AdminStackParamList>()
const Tab = createBottomTabNavigator<AdminTabParamList>()

function tabIcon(name: keyof AdminTabParamList): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'AdminDashboard':
      return 'grid-outline'
    case 'AdminUsers':
      return 'people-outline'
    case 'AdminVerification':
      return 'shield-checkmark-outline'
    case 'AdminUniversityRequests':
      return 'school-outline'
    case 'AdminMore':
      return 'ellipsis-horizontal-outline'
    default:
      return 'ellipse-outline'
  }
}

function AdminTabs() {
  const { t } = useTranslation('admin')
  const c = useThemeColors()
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerTintColor: c.primary,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcon(route.name as keyof AdminTabParamList)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: t('dashboard'), tabBarLabel: t('mobileNavHome') }}
      />
      <Tab.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: t('users'), tabBarLabel: t('mobileNavUsers') }}
      />
      <Tab.Screen
        name="AdminVerification"
        component={AdminVerificationScreen}
        options={{ title: t('mobileVerificationTitle'), tabBarLabel: t('mobileNavVerify') }}
      />
      <Tab.Screen
        name="AdminUniversityRequests"
        component={AdminUniversityRequestsScreen}
        options={{ title: t('universityRequests'), tabBarLabel: t('mobileNavRequests') }}
      />
      <Tab.Screen
        name="AdminMore"
        component={AdminMoreScreen}
        options={{ title: t('mobileMoreTitle'), tabBarLabel: t('mobileNavMore') }}
      />
    </Tab.Navigator>
  )
}

const EXTRA_SCREENS: (keyof AdminStackParamList)[] = [
  'AdminChats',
  'AdminChatDetail',
  'AdminTickets',
  'AdminTicketDetail',
  'AdminHealth',
  'Notifications',
  'ProfileGlobal',
  'Support',
  'Payment',
  'PaymentSuccess',
  'PaymentCancel',
  'Privacy',
  'Cookies',
]

const SCREEN_COMPONENTS: Partial<Record<keyof AdminStackParamList, ComponentType<object>>> = {
  AdminChats: AdminChatsScreen as ComponentType<object>,
  AdminChatDetail: AdminChatDetailScreen as ComponentType<object>,
  AdminTickets: AdminTicketsScreen as ComponentType<object>,
  AdminTicketDetail: AdminTicketDetailScreen as ComponentType<object>,
  AdminHealth: AdminHealthScreen as ComponentType<object>,
  Notifications: NotificationsScreen as ComponentType<object>,
  ProfileGlobal: GlobalAccountProfileScreen as ComponentType<object>,
  Support: SupportScreen as ComponentType<object>,
  Payment: PaymentScreen as ComponentType<object>,
  PaymentSuccess: PaymentSuccessScreen as ComponentType<object>,
  PaymentCancel: PaymentCancelScreen as ComponentType<object>,
  Privacy: PrivacyScreen as ComponentType<object>,
}

export function AdminNavigator() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  return (
    <AppStack.Navigator
      initialRouteName="AdminHome"
      detachInactiveScreens={false}
      screenOptions={{
        headerTintColor: c.primary,
        cardStyle: { backgroundColor: c.background },
      }}
    >
      <AppStack.Screen name="AdminHome" component={AdminTabs} options={{ headerShown: false }} />
      {EXTRA_SCREENS.map((name) => {
        const Comp = SCREEN_COMPONENTS[name] ?? PlaceholderScreen
        return (
          <AppStack.Screen
            key={name}
            name={name}
            component={Comp as never}
            options={{
              title:
                name === 'Privacy'
                  ? t('privacy')
                  : name === 'Cookies'
                    ? t('cookies', 'Cookies')
                    : String(name).replace(/([A-Z])/g, ' $1').trim(),
            }}
          />
        )
      })}
    </AppStack.Navigator>
  )
}
