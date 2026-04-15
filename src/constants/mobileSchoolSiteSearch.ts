import type { StackNavigationProp } from '@react-navigation/stack'
import type { SchoolStackParamList } from '@/navigation/types'

type Nav = StackNavigationProp<SchoolStackParamList>

const PAGES: Array<{
  terms: string[]
  labelKey: string
  navigate: (n: Nav) => void
}> = [
  {
    terms: ['dashboard', 'home', 'главная'],
    labelKey: 'common:home',
    navigate: (n) => n.navigate('SchoolHome', { screen: 'SchoolDashboard' }),
  },
  {
    terms: ['students', 'студенты', 'o‘quvchilar'],
    labelKey: 'school:myStudents',
    navigate: (n) => n.navigate('SchoolHome', { screen: 'CounsellorStudents' }),
  },
  {
    terms: ['join', 'requests', 'заявки'],
    labelKey: 'school:joinRequests',
    navigate: (n) => n.navigate('SchoolHome', { screen: 'CounsellorJoinRequests' }),
  },
  {
    terms: ['profile', 'school', 'школа', 'maktab'],
    labelKey: 'school:mySchool',
    navigate: (n) => n.navigate('SchoolHome', { screen: 'CounsellorSchoolProfile' }),
  },
  {
    terms: ['interests', 'интересы'],
    labelKey: 'school:studentInterestsNav',
    navigate: (n) => n.navigate('SchoolHome', { screen: 'CounsellorStudentInterests' }),
  },
  {
    terms: ['notifications', 'уведомления'],
    labelKey: 'common:notifications',
    navigate: (n) => n.navigate('Notifications'),
  },
  {
    terms: ['account', 'аккаунт'],
    labelKey: 'common:account',
    navigate: (n) => n.navigate('ProfileGlobal'),
  },
  {
    terms: ['support', 'поддержка'],
    labelKey: 'common:support',
    navigate: (n) => n.navigate('Support', {}),
  },
  {
    terms: ['payment', 'subscription'],
    labelKey: 'common:subscriptionAndPayment',
    navigate: (n) => n.navigate('Payment'),
  },
]

export function searchMobileSchoolSitePages(
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
