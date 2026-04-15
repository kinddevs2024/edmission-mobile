import { Platform } from 'react-native'

/**
 * On RN-web, percentage heights and flex chains often collapse unless the document root
 * participates in layout. Without this, embedded iframes stay a small strip.
 */
export function applyWebViewportStyles(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  const { documentElement: html, body } = document
  html.style.height = '100%'
  html.style.margin = '0'
  body.style.height = '100%'
  body.style.margin = '0'
  const root = document.getElementById('root')
  if (root) {
    root.style.flex = '1'
    root.style.minHeight = '100%'
    root.style.height = '100%'
    root.style.display = 'flex'
    root.style.flexDirection = 'column'
  }
}
