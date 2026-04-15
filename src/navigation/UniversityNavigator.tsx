import type { ComponentType } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { GlobalAccountProfileScreen } from '@/screens/common/GlobalAccountProfileScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { PaymentScreen } from '@/screens/common/PaymentScreen'
import { PaymentCancelScreen, PaymentSuccessScreen } from '@/screens/common/PaymentResultScreen'
import { PrivacyScreen } from '@/screens/common/PrivacyScreen'
import { SupportScreen } from '@/screens/common/SupportScreen'
import { PlaceholderScreen } from '@/screens/PlaceholderScreen'
import { UniversityChatTabScreen } from '@/screens/university/UniversityChatTabScreen'
import { UniversityDashboardScreen } from '@/screens/university/UniversityDashboardScreen'
import { UniversityDiscoveryScreen } from '@/screens/university/UniversityDiscoveryScreen'
import { UniversityDocumentsScreen } from '@/screens/university/UniversityDocumentsScreen'
import { UniversityFlyersScreen } from '@/screens/university/UniversityFlyersScreen'
import {
  DocumentTemplateEditorNewWebScreen,
  DocumentTemplateEditorWebScreen,
  UniversityFlyerEditorWebScreen,
} from '@/screens/university/UniversityWebEditorScreens'
import { UniversityOnboardingScreen } from '@/screens/university/UniversityOnboardingScreen'
import { UniversityPendingScreen } from '@/screens/university/UniversityPendingScreen'
import { UniversityPipelineScreen } from '@/screens/university/UniversityPipelineScreen'
import { UniversityProfileEditScreen } from '@/screens/university/UniversityProfileEditScreen'
import { UniversitySearchScreen } from '@/screens/university/UniversitySearchScreen'
import { UniversitySelectScreen } from '@/screens/university/UniversitySelectScreen'
import { UniversityStudentDetailScreen } from '@/screens/university/UniversityStudentDetailScreen'
import { useThemeColors } from '@/theme'
import type {
  UniversityGateStackParamList,
  UniversityStackParamList,
  UniversityTabParamList,
} from '@/navigation/types'

const GateStack = createStackNavigator<UniversityGateStackParamList>()
const AppStack = createStackNavigator<UniversityStackParamList>()
const Tab = createBottomTabNavigator<UniversityTabParamList>()

function tabIcon(name: keyof UniversityTabParamList): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'UniversityDashboard':
      return 'grid-outline'
    case 'UniversityDiscovery':
      return 'people-outline'
    case 'UniversityPipeline':
      return 'git-branch-outline'
    case 'UniversityProfilePage':
      return 'business-outline'
    case 'UniversityChat':
      return 'chatbubble-outline'
    default:
      return 'ellipse-outline'
  }
}

function UniversityTabs() {
  const { t } = useTranslation('university')
  const c = useThemeColors()
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerTintColor: c.primary,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcon(route.name as keyof UniversityTabParamList)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="UniversityDashboard"
        component={UniversityDashboardScreen}
        options={{ title: t('dashboard', 'Dashboard'), tabBarLabel: t('navHome', 'Home') }}
      />
      <Tab.Screen
        name="UniversityDiscovery"
        component={UniversityDiscoveryScreen}
        options={{ title: t('navDiscovery'), tabBarLabel: t('navDiscovery') }}
      />
      <Tab.Screen
        name="UniversityPipeline"
        component={UniversityPipelineScreen}
        options={{ title: t('navPipeline'), tabBarLabel: t('navPipeline') }}
      />
      <Tab.Screen
        name="UniversityProfilePage"
        component={UniversityProfileEditScreen}
        options={{ title: t('navProfile'), tabBarLabel: t('navProfile') }}
      />
      <Tab.Screen
        name="UniversityChat"
        component={UniversityChatTabScreen}
        options={{ title: t('navChat'), tabBarLabel: t('navChat') }}
      />
    </Tab.Navigator>
  )
}

const WEB_EDITOR_SCREENS = new Set<keyof UniversityStackParamList>([
  'UniversityFlyerEditorNew',
  'DocumentTemplateEditorNew',
  'DocumentTemplateEditor',
])

const EXTRA_SCREENS: (keyof UniversityStackParamList)[] = [
  'UniversityOnboarding',
  'UniversityStudentProfile',
  'UniversityDocuments',
  'UniversityFlyers',
  'UniversityFlyerEditorNew',
  'DocumentTemplateEditorNew',
  'DocumentTemplateEditor',
  'OfferTemplates',
  'Scholarships',
  'Faculties',
  'UniversityAnalytics',
  'UniversityAI',
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

const SCREEN_COMPONENTS: Partial<Record<keyof UniversityStackParamList, ComponentType<object>>> = {
  UniversityOnboarding: UniversityOnboardingScreen as ComponentType<object>,
  UniversityStudentProfile: UniversityStudentDetailScreen as ComponentType<object>,
  UniversityDocuments: UniversityDocumentsScreen as ComponentType<object>,
  UniversityFlyers: UniversityFlyersScreen as ComponentType<object>,
  UniversityFlyerEditorNew: UniversityFlyerEditorWebScreen as ComponentType<object>,
  DocumentTemplateEditorNew: DocumentTemplateEditorNewWebScreen as ComponentType<object>,
  DocumentTemplateEditor: DocumentTemplateEditorWebScreen as ComponentType<object>,
  Notifications: NotificationsScreen as ComponentType<object>,
  ProfileGlobal: GlobalAccountProfileScreen as ComponentType<object>,
  Search: UniversitySearchScreen as ComponentType<object>,
  Support: SupportScreen as ComponentType<object>,
  Payment: PaymentScreen as ComponentType<object>,
  PaymentSuccess: PaymentSuccessScreen as ComponentType<object>,
  PaymentCancel: PaymentCancelScreen as ComponentType<object>,
  Privacy: PrivacyScreen as ComponentType<object>,
}

function UniversityVerifiedApp() {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  return (
    <AppStack.Navigator
      initialRouteName="UniversityHome"
      detachInactiveScreens={false}
      screenOptions={{
        headerTintColor: c.primary,
        cardStyle: { backgroundColor: c.background },
      }}
    >
      <AppStack.Screen name="UniversityHome" component={UniversityTabs} options={{ headerShown: false }} />
      {EXTRA_SCREENS.map((name) => {
        const Comp = SCREEN_COMPONENTS[name] ?? PlaceholderScreen
        const headerShown = name === 'Search' || WEB_EDITOR_SCREENS.has(name) ? false : true
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

export function UniversityNavigator() {
  const c = useThemeColors()
  const { user } = useAuth()
  const up = user?.universityProfile

  if (!up) {
    return (
      <GateStack.Navigator
        initialRouteName="UniversitySelect"
        detachInactiveScreens={false}
        screenOptions={{
          headerTintColor: c.primary,
          cardStyle: { backgroundColor: c.background },
        }}
      >
        <GateStack.Screen
          name="UniversitySelect"
          component={UniversitySelectScreen}
          options={{ title: 'Select university' }}
        />
        <GateStack.Screen
          name="UniversityPendingVerification"
          component={UniversityPendingScreen}
          options={{ title: 'Status' }}
        />
      </GateStack.Navigator>
    )
  }

  if (!up.verified) {
    return (
      <GateStack.Navigator
        initialRouteName="UniversityPendingVerification"
        detachInactiveScreens={false}
        screenOptions={{
          headerTintColor: c.primary,
          cardStyle: { backgroundColor: c.background },
        }}
      >
        <GateStack.Screen
          name="UniversityPendingVerification"
          component={UniversityPendingScreen}
          options={{ title: 'Status' }}
        />
        <GateStack.Screen
          name="UniversitySelect"
          component={UniversitySelectScreen}
          options={{ title: 'Select university' }}
        />
      </GateStack.Navigator>
    )
  }

  return <UniversityVerifiedApp />
}
