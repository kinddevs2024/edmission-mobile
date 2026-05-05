import type { StyleProp, ViewStyle } from 'react-native'

/**
 * Fallback when neither `.native` nor `.web` applies (e.g. some desktop targets).
 * Use `GoogleOAuthBlock.native.tsx` / `GoogleOAuthBlock.web.tsx` for real OAuth.
 */
export function GoogleOAuthBlock(_props: {
  mode: 'login' | 'register'
  role: 'student' | 'university'
  googleBusy: boolean
  oauthLocked: boolean
  setParentGoogleBusy: (v: boolean) => void
  termsAccepted?: boolean
  compact?: boolean
  style?: StyleProp<ViewStyle>
}): null {
  return null
}
