/** List/card item for explore and recommendations (student app) */
export interface UniversityListItem {
  id: string
  name: string
  logo?: string
  country?: string
  city?: string
  description?: string
  rating?: number
  foundedYear?: number
  studentCount?: number
  hasScholarship?: boolean
  matchScore?: number
  matchBreakdown?: Record<string, number>
  minLanguageLevel?: string
  tuitionPrice?: number
  facultyCodes?: string[]
  targetStudentCountries?: string[]
}

export interface Program {
  id: string
  universityId: string
  name?: string
  degree?: string
  degreeLevel?: string
  field?: string
  tuition?: number
  duration?: string
}

export interface UniversityProfile {
  id: string
  userId?: string
  name: string
  slug?: string
  logo?: string
  logoUrl?: string
  slogan?: string
  foundedYear?: number
  studentCount?: number
  country?: string
  city?: string
  description?: string
  accreditation?: string
  rating?: number
  onboardingCompleted?: boolean
  facultyCodes?: string[]
  facultyItems?: Record<string, string[]>
  targetStudentCountries?: string[]
  minLanguageLevel?: string
  tuitionPrice?: number
}

export interface UniversityFlyer {
  id: string
  universityId?: string
  title?: string
  source?: 'upload' | 'url' | 'editor'
  mediaUrl?: string
  mediaType?: string
  previewImageUrl?: string
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CatalogUniversity {
  id: string
  name: string
  universityName?: string
  country?: string
  city?: string
  description?: string
  logoUrl?: string
}

export type PipelineStage =
  | 'interested'
  | 'contacted'
  | 'evaluating'
  | 'offer_sent'
  | 'accepted'
  | 'rejected'

export interface Scholarship {
  id: string
  universityId: string
  name: string
  coveragePercent: number
  maxSlots: number
  usedSlots?: number
  deadline?: string
  eligibility?: string
  createdAt?: string
}

export interface Faculty {
  id: string
  universityId: string
  name: string
  description: string
  items?: string[]
  order?: number
}
