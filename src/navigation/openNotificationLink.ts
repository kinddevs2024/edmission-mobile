import { Linking } from 'react-native'
import type { Role } from '@/types/user'

type Nav = {
  navigate: (route: string, params?: object) => void
}

function parsePath(link: string): { pathname: string; query: Record<string, string> } {
  const [pathPart, queryPart] = link.split('?')
  const pathname = pathPart?.startsWith('/') ? pathPart : `/${pathPart ?? ''}`
  const query: Record<string, string> = {}
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=')
      if (k) query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : ''
    }
  }
  return { pathname, query }
}

/** Opens notification target: in-app navigation for known paths, otherwise system browser for http(s). */
export function openNotificationLink(navigation: Nav, role: Role | undefined | null, link: string | undefined): void {
  if (!link?.trim()) return
  const trimmed = link.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    void Linking.openURL(trimmed)
    return
  }
  const { pathname, query } = parsePath(trimmed)

  if (role === 'student') {
    if (pathname === '/student/school-invitations') {
      navigation.navigate('StudentHome', { path: '/student/schools' })
      return
    }
    navigation.navigate('StudentHome', { path: pathname || '/student/dashboard' })
    return
  }

  if (role === 'university') {
    if (pathname === '/university/chat' || pathname.startsWith('/university/chat')) {
      navigation.navigate('UniversityHome', { screen: 'UniversityChat' })
      return
    }
    if (pathname === '/university/documents' || pathname.startsWith('/university/documents')) {
      navigation.navigate('UniversityDocuments')
      return
    }
    if (pathname === '/university/pipeline') {
      navigation.navigate('UniversityHome', { screen: 'UniversityPipeline' })
      return
    }
    navigation.navigate('UniversityHome', { screen: 'UniversityDashboard' })
    return
  }

  if (role === 'school_counsellor') {
    const studentProfileMatch = pathname.match(/^\/school\/students\/([^/]+)\/profile\/?$/)
    if (studentProfileMatch?.[1]) {
      navigation.navigate('CounsellorStudentProfile', { studentId: studentProfileMatch[1] })
      return
    }
    if (pathname === '/school/join-requests') {
      navigation.navigate('SchoolHome', { screen: 'CounsellorJoinRequests' })
      return
    }
    if (pathname === '/school/my-students') {
      navigation.navigate('SchoolHome', { screen: 'CounsellorStudents' })
      return
    }
    if (pathname === '/school/my-school') {
      navigation.navigate('SchoolHome', { screen: 'CounsellorSchoolProfile' })
      return
    }
    if (pathname === '/school/student-interests') {
      navigation.navigate('SchoolHome', { screen: 'CounsellorStudentInterests' })
      return
    }
    if (pathname === '/school/dashboard' || pathname === '/school') {
      navigation.navigate('SchoolHome', { screen: 'SchoolDashboard' })
      return
    }
    if (pathname.startsWith('/admin/chats')) {
      navigation.navigate('SchoolHome', { screen: 'CounsellorStudents' })
      return
    }
    navigation.navigate('SchoolHome', { screen: 'SchoolDashboard' })
    return
  }

  if (role === 'admin') {
    if (pathname === '/admin/university-requests') {
      navigation.navigate('AdminHome', { screen: 'AdminUniversityRequests' })
      return
    }
    if (pathname.startsWith('/admin/chats')) {
      const chatId = query.chatId
      if (chatId) {
        navigation.navigate('AdminChatDetail', { chatId })
      } else {
        navigation.navigate('AdminChats')
      }
      return
    }
    if (pathname === '/admin/dashboard' || pathname === '/admin' || pathname.startsWith('/admin/')) {
      navigation.navigate('AdminHome', { screen: 'AdminDashboard' })
      return
    }
    navigation.navigate('AdminHome', { screen: 'AdminDashboard' })
    return
  }
}
