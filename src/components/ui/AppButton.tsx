import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { fontSize, fontWeight, radii, shadowButton, space, useThemeColors } from '@/theme'

type Props = PressableProps & {
  title: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  style?: StyleProp<ViewStyle>
}

export function AppButton({
  title,
  loading,
  disabled,
  variant = 'primary',
  style,
  ...rest
}: Props) {
  const c = useThemeColors()
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && [styles.primary, { backgroundColor: c.primary }, shadowButton()],
        isSecondary && [
          styles.secondary,
          { borderColor: c.primary, backgroundColor: 'transparent' },
        ],
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && isPrimary && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? c.onPrimary : c.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
            isPrimary && { color: c.onPrimary },
            (isSecondary || variant === 'ghost') && { color: c.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space[3.5],
    paddingHorizontal: space[4],
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {},
  secondary: {
    borderWidth: 2,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {},
})
