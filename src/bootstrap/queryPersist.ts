import type { Query } from '@tanstack/react-query'

const PERSIST_ROOT_KEYS = new Set([
  'student-profile',
  'student-documents',
  'student-applications',
  'student-offers',
  'student-universities',
  'student-recommendations-preview',
  'student-schools',
  'issued-documents-student',
  'issued-document',
  'compare-options',
  'ai-status',
  'student-school-invitations',
  'student-interested-university-ids',
  'student-interest-limit',
  'notifications',
  'university-detail',
  'trustedUniversityLogos',
])

/** Persist list-style queries for offline / fast restore; skip until success. */
export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== 'success') return false
  const key0 = query.queryKey[0]
  if (typeof key0 !== 'string') return false
  if (PERSIST_ROOT_KEYS.has(key0)) return true
  if (key0.startsWith('compare-detail')) return true
  return false
}
