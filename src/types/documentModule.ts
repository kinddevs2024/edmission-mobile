export type DocumentType = 'offer' | 'scholarship'
export type DocumentTemplateStatus = 'draft' | 'active' | 'archived'
export type DocumentPageFormat = 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'LETTER' | 'CUSTOM'
export type StudentDocumentStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'postponed' | 'expired' | 'revoked'

export interface DocumentTemplate {
  id: string
  type: DocumentType
  name: string
  status: DocumentTemplateStatus
  pageFormat: DocumentPageFormat
  width?: number
  height?: number
  editorVersion: string
  canvasJson: string
  previewImageUrl?: string
  isDefault?: boolean
  summary?: string
  updatedAt?: string
  createdAt?: string
}

export interface UniversityDocumentSummary {
  id: string
  type: DocumentType
  status: StudentDocumentStatus
  title?: string
  universityMessage?: string
  frozenTemplateJson: string
  resolvedCanvasJson?: string
  pageFormat?: DocumentPageFormat
  width?: number
  height?: number
  sentAt: string
  student?: { fullName: string; country?: string }
}
