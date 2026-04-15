import { api } from '@/services/api'
import type { UniversityProfile, CatalogUniversity, Scholarship, Faculty, UniversityFlyer } from '@/types/university'
import type { SocialLinks } from '@/types/user'

type UniversityProfileResponse = UniversityProfile & {
  universityName?: string
  tagline?: string
  establishedYear?: number
  minLanguageLevel?: string
  tuitionPrice?: number
}

export type { CatalogUniversity }

export async function getCatalog(params?: { search?: string; country?: string }): Promise<CatalogUniversity[]> {
  const { data } = await api.get<CatalogUniversity[]>('/university/catalog', { params })
  return data ?? []
}

export async function createVerificationRequest(
  payload: string | { universityName: string; establishedYear?: number }
): Promise<{ id: string; status: string }> {
  const body = typeof payload === 'string' ? { universityId: payload } : payload
  const { data } = await api.post<{ id: string; status: string }>('/university/verification-request', body)
  return data ?? { id: '', status: 'pending' }
}

export async function getUniversityProfile(): Promise<UniversityProfile> {
  const { data } = await api.get<UniversityProfileResponse>('/university/profile')
  const d = data ?? ({} as UniversityProfileResponse)
  return {
    ...d,
    name: d.name ?? d.universityName ?? '',
    logo: d.logo ?? d.logoUrl,
    logoUrl: d.logoUrl ?? d.logo,
    slogan: d.slogan ?? (d as { tagline?: string }).tagline,
    foundedYear: d.foundedYear ?? (d as { establishedYear?: number }).establishedYear,
    facultyCodes: (d as { facultyCodes?: string[] }).facultyCodes ?? [],
    facultyItems: (d as { facultyItems?: Record<string, string[]> }).facultyItems ?? undefined,
    targetStudentCountries: (d as { targetStudentCountries?: string[] }).targetStudentCountries ?? [],
    minLanguageLevel: d.minLanguageLevel ?? undefined,
    tuitionPrice: d.tuitionPrice ?? undefined,
  }
}

export async function updateUniversityProfile(patch: Partial<UniversityProfile>): Promise<UniversityProfile> {
  const body: Record<string, unknown> = {}
  if (patch.name != null) body.universityName = patch.name
  if (patch.slogan != null) body.tagline = patch.slogan
  if (patch.foundedYear != null) body.establishedYear = patch.foundedYear
  if (patch.studentCount != null) body.studentCount = patch.studentCount
  if (patch.country != null) body.country = patch.country
  if (patch.city != null) body.city = patch.city
  if (patch.description != null) body.description = patch.description
  const logoUrl = patch.logoUrl ?? patch.logo
  if (logoUrl != null) body.logoUrl = logoUrl
  if (patch.facultyCodes != null) body.facultyCodes = patch.facultyCodes
  if (patch.facultyItems != null) body.facultyItems = patch.facultyItems
  if (patch.targetStudentCountries != null) body.targetStudentCountries = patch.targetStudentCountries
  if (patch.minLanguageLevel != null) body.minLanguageLevel = patch.minLanguageLevel
  if (patch.tuitionPrice != null) body.tuitionPrice = patch.tuitionPrice
  const { data } = await api.put<UniversityProfileResponse | null>('/university/profile', body)
  const raw = data ?? ({} as UniversityProfileResponse)
  return {
    ...raw,
    id: raw.id ?? '',
    name: raw.name ?? raw.universityName ?? '',
    logo: raw.logo ?? raw.logoUrl,
    logoUrl: raw.logoUrl ?? raw.logo,
    slogan: raw.slogan ?? raw.tagline,
    foundedYear: raw.foundedYear ?? raw.establishedYear,
  } as UniversityProfile
}

export async function getScholarships(params?: { page?: number; limit?: number }): Promise<{
  data: Scholarship[]
  total: number
}> {
  const { data } = await api.get<Scholarship[] | { data: Scholarship[]; total: number }>('/university/scholarships', {
    params,
  })
  if (Array.isArray(data)) return { data, total: data.length }
  return { data: data?.data ?? [], total: data?.total ?? 0 }
}

export async function getFaculties(): Promise<Faculty[]> {
  const { data } = await api.get<Faculty[]>('/university/faculties')
  return data ?? []
}

export async function getUniversityFlyers(): Promise<UniversityFlyer[]> {
  const { data } = await api.get<UniversityFlyer[]>('/university/flyers')
  return data ?? []
}

export async function createUniversityFlyer(payload: Partial<UniversityFlyer>): Promise<UniversityFlyer> {
  const { data } = await api.post<UniversityFlyer>('/university/flyers', payload)
  return data
}

export async function deleteUniversityFlyer(id: string): Promise<void> {
  await api.delete(`/university/flyers/${id}`)
}

export interface FunnelAnalytics {
  byStatus: Record<string, number>
  total: number
}

export async function getFunnelAnalytics(): Promise<FunnelAnalytics> {
  const { data } = await api.get<FunnelAnalytics>('/university/analytics/funnel')
  return data ?? { byStatus: {}, total: 0 }
}

export interface UniversityDashboardData {
  pipeline: { status: string; _count: number }[]
  pendingOffers: number
  totalInterests?: number
  interestedCount?: number
  chatCount?: number
  offerSentCount?: number
  acceptedCount?: number
  acceptanceRate?: number
  verified?: boolean
  topRecommendations: {
    id: string
    matchScore?: number
    student?: {
      _id?: string
      firstName?: string
      lastName?: string
      gpa?: number
      country?: string
      userEmail?: string
    }
  }[]
}

export async function getUniversityDashboard(): Promise<UniversityDashboardData> {
  const { data } = await api.get<UniversityDashboardData>('/university/dashboard')
  return data ?? { pipeline: [], pendingOffers: 0, topRecommendations: [] }
}

export interface PipelineItem {
  id: string
  studentProfileId?: string
  status: string
  student?: {
    _id?: unknown
    firstName?: string
    lastName?: string
    country?: string
    gpa?: number
    userEmail?: string
  }
  updatedAt?: string
}

export interface StudentSearchParams {
  page?: number
  limit?: number
  search?: string
  country?: string
  city?: string
  verifiedOnly?: boolean
  useProfileFilters?: boolean
}

export interface DiscoverStudentItem {
  id: string
  student: {
    firstName?: string
    lastName?: string
    userEmail?: string
    country?: string
    city?: string
    avatarUrl?: string
    gpa?: number
    verifiedAt?: string
    profileVisibility?: 'private' | 'public'
  }
  inPipeline: boolean
}

export interface StudentSearchResponse {
  data: DiscoverStudentItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getUniversityStudents(params?: StudentSearchParams): Promise<StudentSearchResponse> {
  const query: Record<string, string> = {}
  if (params?.page != null) query.page = String(params.page)
  if (params?.limit != null) query.limit = String(params.limit)
  if (params?.search) query.search = params.search
  if (params?.country) query.country = params.country
  if (params?.city) query.city = params.city
  if (params?.verifiedOnly) query.verifiedOnly = '1'
  if (params?.useProfileFilters === false) query.useProfileFilters = '0'
  const { data } = await api.get<StudentSearchResponse>('/university/students', { params: query })
  return data ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
}

export interface ReadinessInfo {
  profile: boolean
  education: boolean
  certificates: boolean
  ready: boolean
}

export interface FullStudentProfile {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  socialLinks?: SocialLinks
  country?: string
  city?: string
  gpa?: number
  bio?: string
  avatarUrl?: string
  schoolName?: string
  graduationYear?: number
  targetDegreeLevel?: 'bachelor' | 'master' | 'phd'
  skills?: string[]
  interests?: string[]
  hobbies?: string[]
  verifiedAt?: string
  budgetAmount?: number
  budgetCurrency?: string
  profileVisibility?: 'private' | 'public'
  readiness?: ReadinessInfo
  peerScholarships?: { city: string; coveragePercent: number }[]
}

export async function getUniversityStudentProfile(studentId: string): Promise<FullStudentProfile> {
  const { data } = await api.get<FullStudentProfile>(`/university/students/${studentId}/profile`)
  if (!data) throw new Error('Student not found')
  return data
}

export async function getOfferTemplates(): Promise<unknown[]> {
  const { data } = await api.get<unknown[]>('/university/offer-templates')
  return data ?? []
}

export async function getPipeline(): Promise<PipelineItem[]> {
  const { data } = await api.get<PipelineItem[]>('/university/pipeline')
  return Array.isArray(data) ? data : []
}

export async function updateInterestStatus(
  interestId: string,
  status: 'interested' | 'under_review' | 'chat_opened' | 'offer_sent' | 'rejected' | 'accepted'
): Promise<unknown> {
  const { data } = await api.patch(`/university/interests/${interestId}`, { status })
  return data
}
