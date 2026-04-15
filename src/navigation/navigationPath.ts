import type { NavigationState, PartialState } from '@react-navigation/native'

/**
 * Builds a stable path like `/m/StudentHome/ExploreUniversities` from the navigation tree.
 */
export function getNavigationPathForAnalytics(
  state: NavigationState | PartialState<NavigationState> | undefined
): string {
  if (!state?.routes?.length || state.index == null || state.index < 0) return '/m'
  const names: string[] = []
  let s: NavigationState | PartialState<NavigationState> | undefined = state
  while (s && Array.isArray(s.routes) && s.index != null && s.index >= 0) {
    const r = s.routes[s.index]
    if (r?.name) names.push(String(r.name))
    s = r.state as NavigationState | PartialState<NavigationState> | undefined
  }
  return `/m/${names.join('/')}`
}
