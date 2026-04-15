import { Platform, type ViewStyle } from 'react-native'

const slate = '#0f172a'

/** Subtle card shadow — web `--shadow-card` */
export function shadowCard(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: slate,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  })!
}

/** Stronger lift — web `--shadow-card-hover` (use sparingly) */
export function shadowCardHover(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: slate,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  })!
}

/** CTA glow — web `--shadow-button` (lime-tinted) */
export function shadowButton(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#84cc16',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  })!
}
