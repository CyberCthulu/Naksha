const mockMultiRemove = jest.fn()
const mockCreateClient = jest.fn(() => ({ auth: {} }))

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    multiRemove: mockMultiRemove,
  },
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project-ref.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key'

const { clearPersistedAuthSession } = require('../supabase') as typeof import('../supabase')

describe('Supabase auth storage contract', () => {
  beforeEach(() => {
    mockMultiRemove.mockClear()
  })

  it('configures the client with the same explicit project-scoped storage key', () => {
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://project-ref.supabase.co',
      'public-anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          storageKey: 'sb-project-ref-auth-token',
        }),
      })
    )
  })

  it('clears every auth-js persistence key after a post-deletion sign-out failure', async () => {
    await clearPersistedAuthSession()

    expect(mockMultiRemove).toHaveBeenCalledWith([
      'sb-project-ref-auth-token',
      'sb-project-ref-auth-token-code-verifier',
      'sb-project-ref-auth-token-user',
    ])
  })

  function loadWithEnvironment(url?: string, anonKey?: string) {
    const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const originalAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

    if (url == null) delete process.env.EXPO_PUBLIC_SUPABASE_URL
    else process.env.EXPO_PUBLIC_SUPABASE_URL = url

    if (anonKey == null) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = anonKey

    try {
      jest.isolateModules(() => require('../supabase'))
    } finally {
      if (originalUrl == null) delete process.env.EXPO_PUBLIC_SUPABASE_URL
      else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl

      if (originalAnonKey == null) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
    }
  }

  it('fails clearly when the Supabase URL is missing', () => {
    expect(() => loadWithEnvironment(undefined, 'public-anon-key')).toThrow(
      'Missing required EXPO_PUBLIC_SUPABASE_URL. Configure it for this build environment.'
    )
  })

  it('fails clearly when the Supabase anon key is missing', () => {
    expect(() =>
      loadWithEnvironment('https://project-ref.supabase.co', undefined)
    ).toThrow(
      'Missing required EXPO_PUBLIC_SUPABASE_ANON_KEY. Configure it for this build environment.'
    )
  })

  it.each([
    ['malformed input', 'not a URL'],
    ['unsupported scheme', 'ftp://project-ref.supabase.co'],
    ['hostless URL', 'file:///tmp/supabase'],
  ])('rejects %s', (_case, url) => {
    expect(() => loadWithEnvironment(url, 'public-anon-key')).toThrow(
      'Invalid EXPO_PUBLIC_SUPABASE_URL. Configure an HTTP or HTTPS URL with a hostname.'
    )
  })

  it('accepts a local HTTP Supabase URL', () => {
    loadWithEnvironment('http://127.0.0.1:54321', 'local-anon-key')

    expect(mockCreateClient).toHaveBeenLastCalledWith(
      'http://127.0.0.1:54321',
      'local-anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          storageKey: 'sb-127-auth-token',
        }),
      })
    )
  })
})
