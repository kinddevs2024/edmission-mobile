import type { StackScreenProps } from '@react-navigation/stack'
import { EmbeddedWebAppScreen } from '@/screens/common/EmbeddedWebAppScreen'
import type { StudentStackParamList } from '@/navigation/types'

type Props = StackScreenProps<StudentStackParamList, 'StudentHome'>

function normalizeStudentPath(raw: string | undefined): string {
  if (raw == null || !String(raw).trim()) return '/student/dashboard'
  const s = String(raw).trim()
  return s.startsWith('/') ? s : `/${s}`
}

/**
 * Student area = the same React app as `edmission-front` (routes under `/student/*`),
 * with auth injected into `localStorage` like the website.
 */
export function StudentWebAppScreen({ route }: Props) {
  const webPath = normalizeStudentPath(route.params?.path)
  return <EmbeddedWebAppScreen webPath={webPath} />
}
