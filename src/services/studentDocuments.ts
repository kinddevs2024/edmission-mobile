import { api } from '@/services/api'
import type { StudentDocumentItem, StudentProfileDocumentType } from '@/types/documents'

export async function getMyDocuments(): Promise<StudentDocumentItem[]> {
  const { data } = await api.get<StudentDocumentItem[]>('/student/documents')
  return data ?? []
}

export async function deleteStudentDocument(id: string): Promise<void> {
  await api.delete(`/student/documents/${id}`)
}

export type { StudentDocumentItem, StudentProfileDocumentType }
