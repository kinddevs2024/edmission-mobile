import { api } from '@/services/api'
import type { Ticket } from '@/services/tickets'

/** GET /admin/dashboard */
export interface AdminDashboardResponse {
  users: number
  universities: number
  pendingOffers: number
  pendingVerification: number
  subscriptionsByPlan?: Record<string, number>
  mrr?: number
}

export interface AdminUserRow {
  id: string
  email: string
  role: string
  name?: string
  createdAt: string
  status: 'active' | 'suspended'
}

export interface VerificationItem {
  id: string
  universityId: string
  name: string
  email: string
  country?: string
  submittedAt: string
}

export interface UniversityVerificationRequestItem {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  university?: { name?: string; country?: string; city?: string }
  userEmail?: string
}

export interface UniversityInterestAnalyticsItem {
  universityId: string
  universityName: string
  interestCount: number
  source: 'profile' | 'catalog'
}

export interface AdminChat {
  id: string
  studentId: string
  universityId: string
  universityName?: string
  studentName?: string
  createdAt?: string
  updatedAt?: string
}

export interface AdminChatsResponse {
  data: AdminChat[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminChatMessage {
  id: string
  chatId: string
  senderId: string
  type: string
  message: string
  createdAt: string
}

export interface AdminTicket extends Ticket {
  userEmail?: string
}

export interface AdminTicketsResponse {
  data: AdminTicket[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ServiceHealth {
  name: string
  status: 'up' | 'down'
  latency?: number
  message?: string
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard')
  return data ?? { users: 0, universities: 0, pendingOffers: 0, pendingVerification: 0 }
}

export async function getUniversityInterestAnalytics(limit?: number): Promise<UniversityInterestAnalyticsItem[]> {
  const { data } = await api.get<UniversityInterestAnalyticsItem[]>('/admin/analytics/university-interests', {
    params: limit != null ? { limit } : undefined,
  })
  return Array.isArray(data) ? data : []
}

export async function getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<{
  data: AdminUserRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const { data } = await api.get<{
    data?: Array<Record<string, unknown>>
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }>('/admin/users', { params })
  const rawList = data?.data ?? []
  const rows: AdminUserRow[] = rawList.map((rec) => ({
    id: String(rec.id ?? rec._id ?? ''),
    email: String(rec.email ?? ''),
    role: String(rec.role ?? ''),
    name: rec.name != null ? String(rec.name) : undefined,
    createdAt: rec.createdAt != null ? String(rec.createdAt) : '',
    status: rec.suspended === true ? 'suspended' : 'active',
  }))
  return {
    data: rows,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 0,
  }
}

export async function suspendUser(userId: string, suspend: boolean): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`, { suspend })
}

interface VerificationItemRaw {
  id: string
  universityName?: string
  country?: string
  user?: { email?: string }
  documents?: Array<{ name?: string; url?: string }>
  createdAt?: string
}

export async function getVerificationQueue(): Promise<VerificationItem[]> {
  const { data } = await api.get<VerificationItemRaw[]>('/admin/universities/verification')
  return (data ?? []).map((u) => ({
    id: u.id,
    universityId: u.id,
    name: u.universityName ?? '',
    email: u.user?.email ?? '',
    country: u.country,
    submittedAt: u.createdAt ?? new Date().toISOString(),
  }))
}

export async function approveUniversity(universityId: string): Promise<void> {
  await api.post(`/admin/universities/${universityId}/verify`, { approve: true })
}

export async function rejectUniversity(universityId: string): Promise<void> {
  await api.post(`/admin/universities/${universityId}/verify`, { approve: false })
}

export async function getUniversityVerificationRequests(params?: {
  status?: string
}): Promise<UniversityVerificationRequestItem[]> {
  const { data } = await api.get<UniversityVerificationRequestItem[]>('/admin/university-requests', { params })
  return data ?? []
}

export async function approveUniversityRequest(requestId: string): Promise<void> {
  await api.post(`/admin/university-requests/${requestId}/approve`)
}

export async function rejectUniversityRequest(requestId: string): Promise<void> {
  await api.post(`/admin/university-requests/${requestId}/reject`)
}

export async function getHealth(): Promise<{ status: string; services: ServiceHealth[] }> {
  const { data } = await api.get<{ status: string; services: ServiceHealth[] }>('/admin/health')
  return data ?? { status: 'unknown', services: [] }
}

export async function getChats(params?: {
  page?: number
  limit?: number
  universityId?: string
}): Promise<AdminChatsResponse> {
  const { data } = await api.get<AdminChatsResponse>('/admin/chats', { params })
  return (
    data ?? {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    }
  )
}

export async function getChatMessages(
  chatId: string,
  params?: { limit?: number }
): Promise<{ chat: AdminChat; messages: AdminChatMessage[] }> {
  const { data } = await api.get<{ chat: AdminChat; messages: AdminChatMessage[] }>(
    `/admin/chats/${chatId}/messages`,
    { params }
  )
  return data ?? { chat: {} as AdminChat, messages: [] }
}

export async function sendAdminChatMessage(chatId: string, text: string): Promise<void> {
  await api.post(`/admin/chats/${chatId}/messages`, { text })
}

export async function getAdminTickets(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<AdminTicketsResponse> {
  const { data } = await api.get<AdminTicketsResponse>('/admin/tickets', { params })
  return data ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
}

export async function getAdminTicket(id: string): Promise<AdminTicket> {
  const { data } = await api.get<AdminTicket>(`/admin/tickets/${id}`)
  return data as AdminTicket
}

export async function updateAdminTicketStatus(id: string, status: string): Promise<void> {
  await api.patch(`/admin/tickets/${id}/status`, { status })
}

export async function addAdminTicketReply(id: string, message: string): Promise<void> {
  await api.post(`/admin/tickets/${id}/reply`, { message })
}
