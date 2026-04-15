export type NotificationType =
  | 'message'
  | 'offer'
  | 'document'
  | 'document_viewed'
  | 'document_accepted'
  | 'document_declined'
  | 'document_postponed'
  | 'document_expired'
  | 'document_revoked'
  | 'offer_accepted'
  | 'offer_declined'
  | 'interest'
  | 'status_update'
  | 'system'
  | 'info'
  | 'university_verification_request'
  | 'school_join_request'
  | 'school_invitation_accepted'
  | 'school_invitation_declined'
  | 'school_invitation'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body?: string
  read: boolean
  createdAt: string
  link?: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, unknown>
}
