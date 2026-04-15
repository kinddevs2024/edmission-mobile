import type { NavigationState, PartialState } from '@react-navigation/native'
import { getNavigationPathForAnalytics } from '@/navigation/navigationPath'
import { trackAppScreen } from '@/services/analytics'

let lastTrackedPath = ''

export { getNavigationPathForAnalytics } from '@/navigation/navigationPath'

export function trackNavigationState(state: NavigationState | PartialState<NavigationState> | undefined): void {
  const path = getNavigationPathForAnalytics(state)
  if (path === lastTrackedPath) return
  lastTrackedPath = path
  void trackAppScreen(path).catch(() => {
    /* analytics must not break navigation */
  })
}
