import { api } from '@/services/api'
import type { StudentIssuedDocumentStatus, UniversityDocumentSummary } from '@/types/documents'

export async function listIssuedDocuments(params?: {
  type?: 'offer' | 'scholarship'
  status?: StudentIssuedDocumentStatus
}): Promise<UniversityDocumentSummary[]> {
  const { data } = await api.get<UniversityDocumentSummary[]>('/documents/student-documents', { params })
  return data ?? []
}

export async function getIssuedDocument(id: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.get<UniversityDocumentSummary>(`/documents/student-documents/${id}`)
  if (!data) throw new Error('Document not found')
  return data
}

export async function viewIssuedDocument(id: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/view`)
  if (!data) throw new Error('Failed to mark viewed')
  return data
}

export async function acceptIssuedDocument(id: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/accept`)
  if (!data) throw new Error('Failed to accept')
  return data
}

export async function declineIssuedDocument(id: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/decline`)
  if (!data) throw new Error('Failed to decline')
  return data
}

export async function postponeIssuedDocument(id: string, days: 3 | 7 | 14): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/postpone`, { days })
  if (!data) throw new Error('Failed to postpone')
  return data
}
