import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type ThemeColors } from '@/theme/colors'

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme()
  return scheme === 'dark' ? darkColors : lightColors
}
