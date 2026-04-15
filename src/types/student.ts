export type ApplicationStatus =
  | 'interested'
  | 'under_review'
  | 'chat_opened'
  | 'offer_sent'
  | 'rejected'
  | 'accepted'

export interface Application {
  id: string
  universityId: string
  universityName?: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
}

export interface Recommendation {
  universityId: unknown
  matchScore: number
  breakdown?: Record<string, number>
}

export interface Offer {
  id: string
  applicationId: string
  universityId: string
  universityName?: string
  scholarshipType: 'full' | 'partial' | 'budget'
  coveragePercent?: number
  deadline: string
  isUrgent?: boolean
  createdAt: string
  status?: 'pending' | 'waiting' | 'accepted' | 'declined' | 'expired'
  expiresAt?: string
  certificateTitle?: string
  certificateBody?: string
}
