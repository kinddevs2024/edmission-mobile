import type { Query } from '@tanstack/react-query'
import { shouldPersistQuery } from '@/bootstrap/queryPersist'

function q(key: unknown[], status: 'success' | 'pending'): Query {
  return { queryKey: key, state: { status } } as unknown as Query
}

describe('shouldPersistQuery', () => {
  it('returns false for pending queries', () => {
    expect(shouldPersistQuery(q(['student-profile'], 'pending'))).toBe(false)
  })

  it('returns true for persisted student keys when success', () => {
    expect(shouldPersistQuery(q(['student-profile'], 'success'))).toBe(true)
  })

  it('returns false for unknown keys', () => {
    expect(shouldPersistQuery(q(['unknown-key'], 'success'))).toBe(false)
  })
})
