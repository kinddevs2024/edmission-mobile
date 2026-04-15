/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

/**
 * Load KEY=VAL from .env (no multiline). Does not override existing process.env.
 */
function mergeEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  } catch {
    /* optional files */
  }
}

const root = __dirname
mergeEnvFile(path.join(root, '.env'))
mergeEnvFile(path.join(root, '..', 'edmission-front', '.env'))

const googleWeb =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  ''
const googleExpo =
  process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
  googleWeb
const googleIos =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleWeb
const googleAndroid =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleWeb
const yandexId =
  process.env.EXPO_PUBLIC_YANDEX_CLIENT_ID ||
  process.env.VITE_YANDEX_CLIENT_ID ||
  ''
/**
 * Vite dev server (edmission-front). If unset, infer from API URL: …:4000/api → …:5173
 * so the embedded SPA is never pointed at the JSON API host by mistake.
 */
function inferWebAppUrlFromApiUrl(apiUrl) {
  if (!apiUrl || typeof apiUrl !== 'string') return ''
  const n = apiUrl.trim().replace(/\/$/, '')
  if (!n.endsWith('/api')) return ''
  const origin = n.slice(0, -4)
  try {
    const u = new URL(origin)
    if (u.port === '4000') {
      u.port = '5173'
      return u.origin
    }
    return u.origin
  } catch {
    return ''
  }
}

const webAppUrl =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() ||
  process.env.VITE_WEB_APP_URL?.trim() ||
  inferWebAppUrlFromApiUrl(process.env.EXPO_PUBLIC_API_URL) ||
  inferWebAppUrlFromApiUrl(process.env.VITE_API_URL) ||
  ''

function pluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin
}

function ensurePlugins(plugins) {
  const base = Array.isArray(plugins) ? plugins : []
  const required = ['expo-localization', 'expo-font']
  const existing = new Set(base.map(pluginName))
  const merged = [...base]
  for (const plugin of required) {
    if (!existing.has(plugin)) merged.push(plugin)
  }
  return merged
}

module.exports = ({ config }) => ({
  ...config,
  plugins: ensurePlugins(config.plugins),
  extra: {
    ...(config.extra || {}),
    googleWebClientId: googleWeb,
    googleExpoClientId: googleExpo,
    googleIosClientId: googleIos,
    googleAndroidClientId: googleAndroid,
    yandexClientId: yandexId,
    webAppUrl,
  },
})
