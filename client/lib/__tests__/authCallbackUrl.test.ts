import {
  consumePendingAuthCallbackUrl,
  isAuthCallbackUrl,
  normalizeAuthCallbackUrlForRouting,
  storePendingAuthCallbackUrl,
} from '../authCallbackUrl'

describe('auth callback URL helpers', () => {
  beforeEach(() => {
    consumePendingAuthCallbackUrl()
  })

  it('identifies custom-scheme auth callback URLs with fragments', () => {
    expect(
      isAuthCallbackUrl(
        'naksha://auth/callback#access_token=access-1&refresh_token=refresh-1&type=recovery'
      )
    ).toBe(true)
  })

  it('identifies Expo-style auth callback URLs', () => {
    expect(
      isAuthCallbackUrl(
        'exp://127.0.0.1:8081/--/auth/callback?code=auth-code-1&type=recovery'
      )
    ).toBe(true)
  })

  it('does not treat Supabase verify URLs as app auth callbacks', () => {
    expect(
      isAuthCallbackUrl(
        'https://project.supabase.co/auth/v1/verify?token=token-1&type=recovery&redirect_to=naksha://auth/callback'
      )
    ).toBe(false)
  })

  it('normalizes fragment callbacks for route matching and keeps the raw URL transiently', () => {
    const rawUrl =
      'naksha://auth/callback#access_token=access-1&refresh_token=refresh-1&type=recovery'

    expect(normalizeAuthCallbackUrlForRouting(rawUrl)).toBe(
      'naksha://auth/callback'
    )
    expect(consumePendingAuthCallbackUrl()).toBe(rawUrl)
    expect(consumePendingAuthCallbackUrl()).toBeNull()
  })

  it('stores query callbacks for later consumption', () => {
    const rawUrl = 'naksha://auth/callback?code=auth-code-1&type=recovery'

    storePendingAuthCallbackUrl(rawUrl)

    expect(consumePendingAuthCallbackUrl()).toBe(rawUrl)
  })
})
