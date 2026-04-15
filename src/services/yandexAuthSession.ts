import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import {
  buildYandexAuthorizeUrl,
  parseYandexCallbackUrl,
  type YandexOAuthFlow,
} from '@/utils/yandexOAuthMobile'

export async function openYandexOAuthSession(opts: {
  clientId: string
  role: 'student' | 'university'
  acceptTerms: boolean
  flow: YandexOAuthFlow
}): Promise<{ code: string; redirectUri: string } | null> {
  const redirectUri = Linking.createURL('auth/yandex/callback')
  const authUrl = buildYandexAuthorizeUrl(opts.clientId, redirectUri, {
    role: opts.role,
    acceptTerms: opts.acceptTerms,
    flow: opts.flow,
  })
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, { showInRecents: false })
  if (result.type !== 'success' || !('url' in result) || typeof result.url !== 'string') {
    return null
  }
  const { code, error } = parseYandexCallbackUrl(result.url)
  if (error || !code) return null
  return { code, redirectUri }
}
