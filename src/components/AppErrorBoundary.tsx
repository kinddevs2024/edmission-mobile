import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme/colors'

type Props = { children: ReactNode }
type State = { err: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary', error, info.componentStack)
  }

  override render() {
    if (this.state.err) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.err.message}</Text>
          <Pressable style={styles.btn} onPress={() => this.setState({ err: null })}>
            <Text style={styles.btnTxt}>Try again</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  msg: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
