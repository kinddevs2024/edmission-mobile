import type { StackNavigationProp } from '@react-navigation/stack'
import type { StudentStackParamList } from '@/navigation/types'

type Nav = StackNavigationProp<StudentStackParamList>

const PAGES: Array<{
  terms: string[]
  labelKey: string
  navigate: (n: Nav) => void
}> = [
  {
    terms: ['dashboard', 'home', 'главная', 'boshqaruv'],
    labelKey: 'student:navHome',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/dashboard' }),
  },
  {
    terms: ['profile', 'профиль', 'profil'],
    labelKey: 'student:navProfile',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/profile' }),
  },
  {
    terms: ['universities', 'explore', 'университеты', 'universitetlar'],
    labelKey: 'student:exploreUniversities',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/universities' }),
  },
  {
    terms: ['applications', 'заявки', 'applicatsiyalar'],
    labelKey: 'student:myApplications',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/applications' }),
  },
  {
    terms: ['offers', 'офферы', 'takliflar'],
    labelKey: 'student:allOffers',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/offers' }),
  },
  {
    terms: ['chat', 'чат', 'suhbat'],
    labelKey: 'common:chat',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/chat' }),
  },
  {
    terms: ['documents', 'документы', 'hujjatlar'],
    labelKey: 'student:navDocuments',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/documents' }),
  },
  {
    terms: ['compare', 'сравнить', 'taqqoslash'],
    labelKey: 'student:compareTitle',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/compare' }),
  },
  {
    terms: ['school', 'schools', 'школа', 'maktab'],
    labelKey: 'student:linkToMySchool',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/schools' }),
  },
  {
    terms: ['ai', 'assistant', 'помощник', 'yordamchi'],
    labelKey: 'common:edmissionAi',
    navigate: (n) => n.navigate('StudentHome', { path: '/student/ai' }),
  },
  {
    terms: ['notifications', 'уведомления', 'bildirishnomalar'],
    labelKey: 'common:notifications',
    navigate: (n) => n.navigate('Notifications'),
  },
  {
    terms: ['support', 'поддержка', 'qollab-quvvatlash', 'yordam'],
    labelKey: 'common:support',
    navigate: (n) => n.navigate('Support', {}),
  },
]

export function searchMobileStudentSitePages(
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
