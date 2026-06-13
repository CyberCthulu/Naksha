import supabase from '../supabase'
import { requestPasswordResetEmail } from '../auth'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}))

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      resetPasswordForEmail: jest.Mock
    }
  }
}

describe('auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSupabase().auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  it('requests password reset email with the Naksha auth callback redirect', async () => {
    const result = await requestPasswordResetEmail('ada@example.com')

    expect(result).toEqual({ data: null, error: null })
    expect(
      mockedSupabase().auth.resetPasswordForEmail
    ).toHaveBeenCalledWith('ada@example.com', {
      redirectTo: 'naksha://auth/callback',
    })
  })
})
