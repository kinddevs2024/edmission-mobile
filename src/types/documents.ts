/** Issued university → student documents (offers/scholarships) */
export type IssuedDocumentType = 'offer' | 'scholarship'

export type StudentIssuedDocumentStatus =
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'postponed'
  | 'expired'
  | 'revoked'

export interface UniversityDocumentSummary {
  id: string
  type: IssuedDocumentType
  status: StudentIssuedDocumentStatus
  title?: string
  universityMessage?: string
  renderedPayload: Record<string, unknown>
  frozenTemplateJson: string
  resolvedCanvasJson?: string
  sentAt: string
  viewedAt?: string
  decisionAt?: string
  postponeUntil?: string
  expiresAt?: string
  university?: {
    name: string
    logoUrl?: string
    city?: string
    country?: string
  }
}

export type StudentProfileDocumentType =
  | 'transcript'
  | 'diploma'
  | 'language_certificate'
  | 'course_certificate'
  | 'passport'
  | 'id_card'
  | 'other'

export interface StudentDocumentItem {
  id: string
  type: StudentProfileDocumentType
  source: 'upload' | 'editor'
  name?: string
  certificateType?: string
  score?: string
  fileUrl?: string
  previewImageUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  rejectionReason?: string
  createdAt?: string
  updatedAt?: string
}
