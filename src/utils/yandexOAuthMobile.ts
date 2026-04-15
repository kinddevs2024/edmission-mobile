const YANDEX_AUTHORIZE = 'https://oauth.yandex.ru/authorize'
const YANDEX_SCOPE = 'login:email login:info'

export type YandexOAuthFlow = 'login' | 'register'

export type YandexOAuthStatePayload = {
  role: 'student' | 'university'
  acceptTerms: boolean
  flow: YandexOAuthFlow
  t: number
}

function utf8ToBase64Url(json: string): string {
  if (typeof globalThis.btoa !== 'function') {
    throw new Error('btoa is not available')
  }
  const base64 = globalThis.btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function encodeYandexOAuthState(payload: Omit<YandexOAuthStatePayload, 't'>): string {
  const full: YandexOAuthStatePayload = { ...payload, t: Date.now() }
  return utf8ToBase64Url(JSON.stringify(full))
}

export function buildYandexAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  statePayload: Omit<YandexOAuthStatePayload, 't'>
): string {
  const state = encodeYandexOAuthState(statePayload)
  const encRedirect = encodeURIComponent(redirectUri)
  const scope = encodeURIComponent(YANDEX_SCOPE)
  return `${YANDEX_AUTHORIZE}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encRedirect}&scope=${scope}&state=${encodeURIComponent(state)}`
}

export function parseYandexCallbackUrl(url: string): { code: string | null; error: string | null } {
  try {
    const q = url.indexOf('?')
    const h = url.indexOf('#')
    const queryStart = q >= 0 ? q : h
    if (queryStart < 0) return { code: null, error: null }
    const qs = url.slice(queryStart + 1).split('#')[0]
    const params = new URLSearchParams(qs)
    return { code: params.get('code'), error: params.get('error') }
  } catch {
    return { code: null, error: 'invalid_url' }
  }
}
