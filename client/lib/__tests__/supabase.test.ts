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
})
