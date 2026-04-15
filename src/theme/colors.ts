/**
 * Palettes aligned with edmission-front `src/styles/index.css` (:root / .dark).
 * `colors` is the default light theme for backward compatibility.
 */
export type ThemeColors = {
  primaryDark: string
  primary: string
  primaryMuted: string
  onPrimary: string
  secondary: string
  background: string
  card: string
  border: string
  text: string
  textMuted: string
  danger: string
  success: string
  info: string
  warning: string
  statusAccepted: string
  statusUnderReview: string
  statusOfferSent: string
  statusRejected: string
}

export const lightColors: ThemeColors = {
  primaryDark: '#0f172a',
  primary: '#84cc16',
  primaryMuted: '#ecfccb',
  onPrimary: '#0f172a',
  secondary: '#1e293b',
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  textMuted: '#475569',
  danger: '#dc2626',
  success: '#22c55e',
  info: '#3b82f6',
  warning: '#eab308',
  statusAccepted: '#22c55e',
  statusUnderReview: '#3b82f6',
  statusOfferSent: '#84cc16',
  statusRejected: '#64748b',
} as const satisfies ThemeColors

export const darkColors: ThemeColors = {
  primaryDark: '#f8fafc',
  primary: '#84cc16',
  primaryMuted: '#1a2e05',
  onPrimary: '#0f172a',
  secondary: '#cbd5e1',
  background: '#0f172a',
  card: '#111827',
  border: '#1f2937',
  text: '#f9fafb',
  textMuted: '#cbd5e1',
  danger: '#f87171',
  success: '#4ade80',
  info: '#60a5fa',
  warning: '#facc15',
  statusAccepted: '#4ade80',
  statusUnderReview: '#60a5fa',
  statusOfferSent: '#84cc16',
  statusRejected: '#94a3b8',
} as const satisfies ThemeColors

/** Default export used across the app (light). Prefer `useThemeColors()` for dark-aware UI. */
export const colors: ThemeColors = lightColors
