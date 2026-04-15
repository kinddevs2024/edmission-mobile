import type { StackNavigationProp } from '@react-navigation/stack'
import type { UniversityStackParamList } from '@/navigation/types'

type Nav = StackNavigationProp<UniversityStackParamList>

const PAGES: Array<{
  terms: string[]
  labelKey: string
  navigate: (n: Nav) => void
}> = [
  {
    terms: ['dashboard', 'home', 'главная'],
    labelKey: 'common:home',
    navigate: (n) => n.navigate('UniversityHome', { screen: 'UniversityDashboard' }),
  },
  {
    terms: ['discovery', 'discover', 'поиск', 'students'],
    labelKey: 'university:navDiscovery',
    navigate: (n) => n.navigate('UniversityHome', { screen: 'UniversityDiscovery' }),
  },
  {
    terms: ['pipeline', 'воронка'],
    labelKey: 'university:navPipeline',
    navigate: (n) => n.navigate('UniversityHome', { screen: 'UniversityPipeline' }),
  },
  {
    terms: ['chat', 'чат'],
    labelKey: 'common:chat',
    navigate: (n) => n.navigate('UniversityHome', { screen: 'UniversityChat' }),
  },
  {
    terms: ['documents', 'документы'],
    labelKey: 'common:documents',
    navigate: (n) => n.navigate('UniversityDocuments'),
  },
  {
    terms: ['flyers', 'флаеры', 'посты'],
    labelKey: 'university:navFlyers',
    navigate: (n) => n.navigate('UniversityFlyers'),
  },
  {
    terms: ['notifications', 'уведомления'],
    labelKey: 'common:notifications',
    navigate: (n) => n.navigate('Notifications'),
  },
  {
    terms: ['profile', 'account', 'профиль', 'аккаунт'],
    labelKey: 'common:account',
    navigate: (n) => n.navigate('ProfileGlobal'),
  },
  {
    terms: ['support', 'поддержка'],
    labelKey: 'common:support',
    navigate: (n) => n.navigate('Support', {}),
  },
  {
    terms: ['payment', 'subscription', 'оплата'],
    labelKey: 'common:subscriptionAndPayment',
    navigate: (n) => n.navigate('Payment'),
  },
  {
    terms: ['ai', 'assistant'],
    labelKey: 'common:edmissionAi',
    navigate: (n) => n.navigate('UniversityAI'),
  },
]

export function searchMobileUniversitySitePages(
  query: string
): Array<{ labelKey: string; navigate: (n: Nav) => void }> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return PAGES.filter((p) =>
    p.terms.some((term) => term.toLowerCase().includes(q) || q.includes(term.toLowerCase()))
  )
    .slice(0, 8)
    .map(({ labelKey, navigate }) => ({ labelKey, navigate }))
}
