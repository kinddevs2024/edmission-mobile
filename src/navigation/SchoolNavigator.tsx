import type { ComponentType } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { GlobalAccountProfileScreen } from '@/screens/common/GlobalAccountProfileScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { PaymentScreen } from '@/screens/common/PaymentScreen'
import { PaymentCancelScreen, PaymentSuccessScreen } from '@/screens/common/PaymentResultScreen'
import { SupportScreen } from '@/screens/common/SupportScreen'
import { PlaceholderScreen } from '@/screens/PlaceholderScreen'
import { CounsellorJoinRequestsScreen } from '@/screens/school/CounsellorJoinRequestsScreen'
import { CounsellorSchoolProfileScreen } from '@/screens/school/CounsellorSchoolProfileScreen'
import { CounsellorStudentInterestsScreen } from '@/screens/school/CounsellorStudentInterestsScreen'
import { CounsellorStudentProfileScreen } from '@/screens/school/CounsellorStudentProfileScreen'
import { CounsellorStudentsScreen } from '@/screens/school/CounsellorStudentsScreen'
import { SchoolDashboardScreen } from '@/screens/school/SchoolDashboardScreen'
import { SchoolSearchScreen } from '@/screens/school/SchoolSearchScreen'
import { PrivacyScreen } from '@/screens/common/PrivacyScreen'
import { useThemeColors } from '@/theme'
import type { SchoolStackParamList, SchoolTabParamList } from '@/navigation/types'

const AppStack = createStackNavigator<SchoolStackParamList>()
const Tab = createBottomTabNavigator<SchoolTabParamList>()

function tabIcon(name: keyof SchoolTabParamList): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'SchoolDashboard':
      return 'grid-outline'
    case 'CounsellorStudents':
      return 'people-outline'
    case 'CounsellorStudentInterests':
      return 'school-outline'
    case 'CounsellorJoinRequests':
      return 'mail-unread-outline'
    case 'CounsellorSchoolProfile':
      return 'business-outline'
    default:
      return 'ellipse-outline'
  }
}

function SchoolTabs() {
  const { t } = useTranslation('school')
  const c = useThemeColors()
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerTintColor: c.primary,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcon(route.name as keyof SchoolTabParamList)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="SchoolDashboard"
        component={SchoolDashboardScreen}
        options={{ title: t('dashboard'), tabBarLabel: t('navHome') }}
      />
      <Tab.Screen
        name="CounsellorStudents"
        component={CounsellorStudentsScreen}
        options={{ title: t('myStudents'), tabBarLabel: t('navStudents') }}
      />
      <Tab.Screen
        name="CounsellorStudentInterests"
        component={CounsellorStudentInterestsScreen}
        options={{ title: t('studentInterestsNav'), tabBarLabel: t('navInterests') }}
      />
      <Tab.Screen
        name="CounsellorJoinRequests"
        component={CounsellorJoinRequestsScreen}
        options={{ title: t('joinRequests'), tabBarLabel: t('navRequests') }}
      />
      <Tab.Screen
        name="CounsellorSchoolProfile"
        component={CounsellorSchoolProfileScreen}
        options={{ title: t('mySchool'), tabBarLabel: t('navSchool') }}
      />
    </Tab.Navigator>
  )
}

const EXTRA_SCREENS: (keyof SchoolStackParamList)[] = [
  'CounsellorStudentProfile',
  'Notifications',
  'ProfileGlobal',
  'Search',
  'Support',
  'Payment',
  'PaymentSuccess',
  'PaymentCancel',
  'Privacy',
  'Cookies',
]

const SCREEN_COMPONENTS: Partial<Record<keyof SchoolStackParamList, ComponentType<object>>> = {
  CounsellorStudentProfile: CounsellorStudentProfileScreen as ComponentType<object>,
  Notifications: NotificationsScreen as ComponentType<object>,
  ProfileGlobal: GlobalAccountProfileScreen as ComponentType<object>,
  Search: SchoolSearchScreen as ComponentType<object>,
  Support: SupportScreen as ComponentType<object>,
  Payment: PaymentScreen as ComponentType<object>,
  PaymentSuccess: PaymentSuccessScreen as ComponentType<object>,
  PaymentCancel: PaymentCancelScreen as ComponentType<object>,
  Privacy: PrivacyScreen as ComponentType<object>,
}

export function SchoolNavigator() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  return (
    <AppStack.Navigator
      initialRouteName="SchoolHome"
      detachInactiveScreens={false}
      screenOptions={{
        headerTintColor: c.primary,
        cardStyle: { backgroundColor: c.background },
      }}
    >
      <AppStack.Screen name="SchoolHome" component={SchoolTabs} options={{ headerShown: false }} />
      {EXTRA_SCREENS.map((name) => {
        const Comp = SCREEN_COMPONENTS[name] ?? PlaceholderScreen
        const headerShown = name === 'Search' ? false : true
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
              headerShown,
            }}
          />
        )
      })}
    </AppStack.Navigator>
  )
}
