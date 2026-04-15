import type { NavigationState } from '@react-navigation/native'
import { getNavigationPathForAnalytics } from '@/navigation/navigationPath'

describe('getNavigationPathForAnalytics', () => {
  it('returns /m for empty state', () => {
    expect(getNavigationPathForAnalytics(undefined)).toBe('/m')
  })

  it('joins nested route names', () => {
    const inner: NavigationState = {
      stale: false,
      type: 'tab',
      key: 'tab',
      index: 1,
      routeNames: ['A', 'B'],
      routes: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
      ],
    }
    const root: NavigationState = {
      stale: false,
      type: 'stack',
      key: 'root',
      index: 0,
      routeNames: ['Home'],
      routes: [{ key: 'home', name: 'StudentHome', state: inner }],
    }
    expect(getNavigationPathForAnalytics(root)).toBe('/m/StudentHome/B')
  })
})
