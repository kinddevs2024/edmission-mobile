/** Same catalog as web `ExploreUniversities` country filter */
export const EXPLORE_COUNTRIES = [
  'USA',
  'UK',
  'Germany',
  'Netherlands',
  'Uzbekistan',
  'Russia',
  'Kazakhstan',
  'Turkey',
  'Canada',
  'Australia',
] as const

export type ExploreSort = 'match' | 'name' | 'tuition_asc' | 'tuition_desc' | 'newest'
