import { Platform } from 'react-native'
import { api } from '@/services/api'
import { API_URL } from '@/config/env'

function apiOrigin(): string {
  return API_URL.replace(/\/api\/?$/, '')
}

/** Resolve relative upload paths for Image uri. */
export function getImageUrl(value: string | undefined | null): string {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  let path = value.startsWith('/') ? value : `/${value}`
  const base = apiOrigin()
  if (path.startsWith('/uploads/') && !path.startsWith('/api/')) {
    path = `/api${path}`
  }
  return `${base}${path}`
}

function resolveUploadUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = apiOrigin()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export type UploadableFile = { uri: string; name: string; type: string }

export async function uploadFile(file: UploadableFile): Promise<string> {
  const formData = new FormData()
  const uri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri
  formData.append('file', { uri, name: file.name, type: file.type } as unknown as Blob)
  const { data } = await api.post<{ url: string }>('/upload', formData)
  return resolveUploadUrl(data?.url ?? '')
}
