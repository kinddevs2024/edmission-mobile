import { api } from '@/services/api'

export type TrustedUniversityLogo = {
  id: string
  name: string
  logoUrl: string
}

export type TrustedUniversityLogoPage = {
  items: TrustedUniversityLogo[]
  total: number
  limit: number
  offset: number
  nextOffset: number | null
  hasMore: boolean
}

function normalizeTrustedUniversityLogoPage(
  data: TrustedUniversityLogo[] | TrustedUniversityLogoPage | null | undefined,
  limit: number,
  offset: number
): TrustedUniversityLogoPage {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit,
      offset,
      nextOffset: null,
      hasMore: false,
    }
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const total = typeof data?.total === 'number' && Number.isFinite(data.total) ? data.total : items.length
  const nextOffset =
    typeof data?.nextOffset === 'number' && Number.isFinite(data.nextOffset)
      ? data.nextOffset
      : offset + items.length < total
        ? offset + items.length
        : null

  return {
    items,
    total,
    limit: typeof data?.limit === 'number' && Number.isFinite(data.limit) ? data.limit : limit,
    offset: typeof data?.offset === 'number' && Number.isFinite(data.offset) ? data.offset : offset,
    nextOffset,
    hasMore: typeof data?.hasMore === 'boolean' ? data.hasMore : nextOffset !== null,
  }
}

export async function fetchTrustedUniversityLogoPage({
  limit = 25,
  offset = 0,
}: {
  limit?: number
  offset?: number
} = {}): Promise<TrustedUniversityLogoPage> {
  const { data } = await api.get<TrustedUniversityLogo[] | TrustedUniversityLogoPage>('/public/trusted-university-logos', {
    params: { limit, offset },
  })
  return normalizeTrustedUniversityLogoPage(data, limit, offset)
}

export async function fetchTrustedUniversityLogos(limit = 25): Promise<TrustedUniversityLogo[]> {
  const page = await fetchTrustedUniversityLogoPage({ limit, offset: 0 })
  return page.items
}
