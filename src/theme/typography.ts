import { Platform } from 'react-native'

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 32,
} as const

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

/** Default body font — system UI like web `font-sans` */
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
})
