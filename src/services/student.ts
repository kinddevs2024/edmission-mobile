import { api } from '@/services/api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type { Application, Offer, Recommendation } from '@/types/student'
import type { UniversityListItem, UniversityProfile, Program, Scholarship, Faculty } from '@/types/university'

export interface StudentProfileData {
  id?: string
  userId?: string
  firstName?: string
  lastName?: string
  birthDate?: string
  country?: string
  city?: string
  gradeLevel?: string
  gpa?: number
  languageLevel?: string
  bio?: string
  avatarUrl?: string
  portfolioCompletionPercent?: number
  minimalPortfolioComplete?: boolean
  user?: { email: string; emailVerified?: boolean }
}

export interface UniversitiesParams extends PaginationParams {
  search?: string
  country?: string
  hasScholarship?: boolean
  facultyCodes?: string[]
  degreeLevels?: string[]
  programLanguages?: string[]
  targetStudentCountries?: string[]
  minTuition?: number
  maxTuition?: number
  minEstablishedYear?: number
  maxEstablishedYear?: number
  minStudentCount?: number
  maxStudentCount?: number
  requirementsQuery?: string
  programQuery?: string
  sort?: 'match' | 'name' | 'rating' | 'tuition_asc' | 'tuition_desc' | 'newest'
  useProfileFilters?: boolean
}

function normalizeUniversityItem(
  u: UniversityListItem & {
    universityName?: string
    logoUrl?: string
    breakdown?: Record<string, number>
    matchBreakdown?: Record<string, number>
  }
): UniversityListItem {
  return {
    ...u,
    name: u.name ?? u.universityName ?? '',
    logo: u.logo ?? u.logoUrl,
    matchBreakdown: u.matchBreakdown ?? u.breakdown,
  }
}

export async function getStudentProfile(): Promise<StudentProfileData> {
  const { data } = await api.get<StudentProfileData>('/student/profile')
  return data
}

export async function getUniversities(params?: UniversitiesParams): Promise<PaginatedResponse<UniversityListItem>> {
  const query: Record<string, string> = {}
  if (params?.page != null) query.page = String(params.page)
  if (params?.limit != null) query.limit = String(params.limit)
  if (params?.search) query.search = params.search
  if (params?.country) query.country = params.country
  if (params?.hasScholarship) query.hasScholarship = '1'
  if (params?.facultyCodes?.length) query.facultyCodes = params.facultyCodes.join(',')
  if (params?.degreeLevels?.length) query.degreeLevels = params.degreeLevels.join(',')
  if (params?.programLanguages?.length) query.programLanguages = params.programLanguages.join(',')
  if (params?.targetStudentCountries?.length) query.targetStudentCountries = params.targetStudentCountries.join(',')
  if (params?.minTuition != null) query.minTuition = String(params.minTuition)
  if (params?.maxTuition != null) query.maxTuition = String(params.maxTuition)
  if (params?.minEstablishedYear != null) query.minEstablishedYear = String(params.minEstablishedYear)
  if (params?.maxEstablishedYear != null) query.maxEstablishedYear = String(params.maxEstablishedYear)
  if (params?.minStudentCount != null) query.minStudentCount = String(params.minStudentCount)
  if (params?.maxStudentCount != null) query.maxStudentCount = String(params.maxStudentCount)
  if (params?.requirementsQuery) query.requirementsQuery = params.requirementsQuery
  if (params?.programQuery) query.programQuery = params.programQuery
  if (params?.sort) query.sort = params.sort
  if (params?.useProfileFilters === false) query.useProfileFilters = '0'

  const res = await api.get<PaginatedResponse<UniversityListItem & { universityName?: string }>>('/student/universities', {
    params: query,
  })
  const body = res.data
  if (!body) return { data: [], total: 0, page: 1 }
  const list = body.data ?? []
  const total = body.total ?? 0
  const page = body.page ?? 1
  return { data: list.map((u) => normalizeUniversityItem(u)), total, page }
}

export async function getRecommendations(params?: PaginationParams): Promise<PaginatedResponse<Recommendation>> {
  const { data } = await api.get<Recommendation[] | PaginatedResponse<Recommendation>>('/student/recommendations', {
    params,
  })
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1 }
  }
  return data
}

export async function getApplications(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get<Application[] | PaginatedResponse<Application>>('/student/applications', { params })
  const list = Array.isArray(data) ? data : data?.data ?? []
  const total = Array.isArray(data) ? list.length : data?.total ?? 0
  const page = Array.isArray(data) ? 1 : data?.page ?? 1
  const normalized = list.map((a: Application & { university?: { universityName?: string } }) => ({
    ...a,
    universityName: a.universityName ?? a.university?.universityName,
  }))
  return { data: normalized, total, page }
}

export async function getOffers(params?: PaginationParams): Promise<PaginatedResponse<Offer>> {
  const { data } = await api.get<Offer[] | PaginatedResponse<Offer>>('/student/offers', { params })
  const list = Array.isArray(data) ? data : data?.data ?? []
  const total = Array.isArray(data) ? list.length : data?.total ?? 0
  const page = Array.isArray(data) ? 1 : data?.page ?? 1
  const normalized = list.map(
    (o: Offer & { university?: { universityName?: string }; scholarship?: { coveragePercent?: number } }) => ({
      ...o,
      universityName: o.universityName ?? o.university?.universityName,
      scholarshipType: (o.scholarshipType ??
        (o.scholarship?.coveragePercent === 100 ? 'full' : 'partial')) as Offer['scholarshipType'],
      coveragePercent: o.coveragePercent ?? o.scholarship?.coveragePercent,
    })
  )
  return { data: normalized, total, page }
}

export type UniversityDetailResponse = UniversityProfile & {
  programs?: Program[]
  scholarships?: Scholarship[]
  faculties?: Faculty[]
  matchScore?: number
  breakdown?: Record<string, number>
}

export async function getUniversityDetail(id: string): Promise<UniversityDetailResponse> {
  const { data } = await api.get<UniversityDetailResponse>(`/student/universities/${id}`)
  return data
}

export interface InterestLimit {
  allowed: boolean
  current: number
  limit: number | null
  trialExpired?: boolean
}

export async function getInterestLimit(): Promise<InterestLimit> {
  const { data } = await api.get<InterestLimit>('/student/interests/limit')
  return data ?? { allowed: false, current: 0, limit: 3 }
}

export async function showInterest(universityId: string): Promise<void> {
  await api.post(`/student/universities/${universityId}/interest`)
}

export async function getInterestedUniversityIds(): Promise<string[]> {
  const { data } = await api.get<{ ids: string[] }>('/student/interests/university-ids')
  return data?.ids ?? []
}

export async function getCompareUniversities(ids: string[]): Promise<UniversityListItem[]> {
  if (ids.length === 0) return []
  const { data } = await api.get<UniversityListItem[] | { data: (UniversityListItem & { universityName?: string })[] }>(
    '/student/compare',
    { params: { ids: ids.join(',') } }
  )
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map((u) => normalizeUniversityItem(u as UniversityListItem & { universityName?: string }))
}

export async function acceptOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/accept`)
}

export async function declineOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/decline`)
}

export async function waitOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/wait`)
}

export interface SchoolsListResponse {
  data: {
    id: string
    counsellorUserId: string
    schoolName: string
    schoolDescription: string
    country: string
    city: string
    counsellorName: string
    requestStatus?: 'pending' | 'accepted' | null
  }[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function listSchools(params?: { search?: string; page?: number; limit?: number }): Promise<SchoolsListResponse> {
  const { data } = await api.get<SchoolsListResponse>('/student/schools', { params })
  if (!data) {
    return { data: [], total: 0, page: 1, limit: params?.limit ?? 15, totalPages: 1 }
  }
  return data
}

export async function requestToJoinSchool(counsellorUserId: string): Promise<void> {
  await api.post(`/student/schools/${counsellorUserId}/request`)
}

export interface SchoolInvitationItem {
  id: string
  counsellorUserId: string
  schoolName: string
  city: string
  country: string
  createdAt: string
}

export async function listSchoolInvitations(): Promise<SchoolInvitationItem[]> {
  const { data } = await api.get<SchoolInvitationItem[]>('/student/school-invitations')
  return data ?? []
}

export async function acceptSchoolInvitation(
  invitationId: string
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(
    `/student/school-invitations/${invitationId}/accept`
  )
  return data
}

export async function declineSchoolInvitation(
  invitationId: string
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(
    `/student/school-invitations/${invitationId}/decline`
  )
  return data
}

function toUniversityId(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && ('id' in v || '_id' in v)) {
    return String((v as { id?: unknown; _id?: unknown }).id ?? (v as { _id?: unknown })._id ?? '')
  }
  return ''
}

/** Resolve recommendation ids to list items (same flow as web dashboard). */
export async function getRecommendedUniversitiesPreview(limit = 5): Promise<UniversityListItem[]> {
  const recs = await getRecommendations({ limit })
  const ids = (recs.data ?? [])
    .map((r) => toUniversityId(r.universityId))
    .filter(Boolean)
    .slice(0, limit)
  if (ids.length === 0) return []
  return getCompareUniversities(ids)
}
