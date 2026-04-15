import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type Props = TextInputProps & {
  label: string
  error?: string
  hint?: string
  secureToggle?: boolean
}

/** Props that must be boolean on Android Fabric — strings like "true" crash native code. */
const BOOLEAN_INPUT_KEYS = new Set<string>([
  'allowFontScaling',
  'autoCorrect',
  'autoFocus',
  'blurOnSubmit',
  'caretHidden',
  'contextMenuHidden',
  'disableFullscreenUI',
  'editable',
  'includeFontPadding',
  'multiline',
  'rejectResponderTermination',
  'scrollEnabled',
  'secureTextEntry',
  'selectTextOnFocus',
  'showSoftInputOnFocus',
  'spellCheck',
])

function sanitizeTextInputProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(props)) {
    if (key === 'name' || key === 'id' || key === 'readOnly') continue
    let v: unknown = raw
    if (BOOLEAN_INPUT_KEYS.has(key) && typeof v === 'string') {
      v = v === 'true' || v === '1'
    }
    if (key === 'maxLength' && typeof v === 'string') {
      const n = parseInt(v, 10)
      v = Number.isFinite(n) ? n : undefined
    }
    if (v !== undefined) out[key] = v
  }
  return out
}

export function AppTextField({
  label,
  error,
  hint,
  secureToggle,
  secureTextEntry,
  style,
  ...rest
}: Props) {
  const c = useThemeColors()
  const [hidden, setHidden] = useState(true)
  const secure = secureToggle ? hidden : Boolean(secureTextEntry)

  const sanitized = sanitizeTextInputProps(rest as Record<string, unknown>)

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldRow,
          {
            borderColor: error ? c.danger : c.border,
            backgroundColor: 'transparent',
            borderRadius: radii.md,
            minHeight: 44,
          },
        ]}
      >
        <TextInput
          {...sanitized}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { color: c.text, fontSize: fontSize.base, backgroundColor: 'transparent' }, style]}
          secureTextEntry={Boolean(secure)}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.toggle}
          >
            <Text style={[styles.toggleText, { color: c.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }]}>
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {hint && !error ? (
        <Text style={[styles.hint, { color: c.textMuted, fontSize: fontSize.sm }]}>{hint}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.error, { color: c.danger, fontSize: fontSize.sm }]}>{error}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space[4] },
  label: { marginBottom: space[1.5] },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: space[3],
    paddingHorizontal: space[3.5],
  },
  toggle: { paddingRight: space[3] },
  toggleText: {},
  hint: { marginTop: space[1], lineHeight: 18 },
  error: { marginTop: space[1] },
})
