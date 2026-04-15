import { API_URL } from '@/config/env'

const apiOrigin = API_URL.replace(/\/api\/?$/, '')

/** Same rules as edmission-front `getImageUrl` for `/uploads` → `/api/uploads`. */
export function getImageUrl(value: string | undefined | null): string {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  let path = value.startsWith('/') ? value : `/${value}`
  if (path.startsWith('/uploads/') && !path.startsWith('/api/')) {
    path = `/api${path}`
  }
  return apiOrigin ? `${apiOrigin}${path}` : path
}
