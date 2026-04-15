import { api } from '@/services/api'
import type { DocumentTemplate, UniversityDocumentSummary } from '@/types/documentModule'

export async function getDocumentTemplates(params?: {
  type?: 'offer' | 'scholarship'
  status?: 'draft' | 'active' | 'archived'
}): Promise<DocumentTemplate[]> {
  const { data } = await api.get<DocumentTemplate[]>('/documents/templates', { params })
  return data ?? []
}

export async function listIssuedDocuments(params?: {
  type?: 'offer' | 'scholarship'
  status?: UniversityDocumentSummary['status']
}): Promise<UniversityDocumentSummary[]> {
  const { data } = await api.get<UniversityDocumentSummary[]>('/documents/student-documents', { params })
  return data ?? []
}

export async function updateDocumentTemplate(
  id: string,
  payload: Partial<DocumentTemplate>
): Promise<DocumentTemplate> {
  const { data } = await api.patch<DocumentTemplate>(`/documents/templates/${id}`, payload)
  return data
}
