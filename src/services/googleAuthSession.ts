import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { getWebAppUrl } from '@/config/oauth'

type Mode = 'login' | 'register'

function buildGoogleMobileWebAuthUrl(params: {
  webAppUrl: string
  returnUrl: string
  mode: Mode
  role: 'student' | 'university'
  acceptTerms: boolean
}): string {
  const url = new URL('/auth/google/mobile', params.webAppUrl)
  url.searchParams.set('returnUrl', params.returnUrl)
  url.searchParams.set('mode', params.mode)
  url.searchParams.set('role', params.role)
  url.searchParams.set('acceptTerms', params.acceptTerms ? '1' : '0')
  return url.toString()
}

function parseGoogleMobileCallbackUrl(url: string): { idToken: string | null; error: string | null } {
  try {
    const parsed = new URL(url)
    return {
      idToken: parsed.searchParams.get('idToken'),
      error: parsed.searchParams.get('error'),
    }
  } catch {
    return { idToken: null, error: 'invalid_callback_url' }
  }
}

export async function openGoogleWebAuthSession(opts: {
  mode: Mode
  role: 'student' | 'university'
  acceptTerms: boolean
}): Promise<{ idToken: string } | null> {
  const webAppUrl = getWebAppUrl()
  if (!webAppUrl) return null

  const returnUrl = Linking.createURL('auth/google/callback')
  const authUrl = buildGoogleMobileWebAuthUrl({
    webAppUrl,
    returnUrl,
    mode: opts.mode,
    role: opts.role,
    acceptTerms: opts.acceptTerms,
  })

  const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl, { showInRecents: false })
  if (result.type !== 'success' || !('url' in result) || typeof result.url !== 'string') {
    return null
  }

  const { idToken, error } = parseGoogleMobileCallbackUrl(result.url)
  if (error || !idToken) return null

  return { idToken }
}
