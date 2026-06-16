import supabase from '../supabase'
import {
  requestPasswordResetEmail,
  resendSignupEmail,
  signUpWithEmail,
} from '../auth'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      resend: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signUp: jest.fn(),
    },
  },
}))

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      resend: jest.Mock
      resetPasswordForEmail: jest.Mock
      signUp: jest.Mock
    }
  }
}

describe('auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSupabase().auth.resend.mockResolvedValue({
      data: null,
      error: null,
    })
    mockedSupabase().auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: null,
    })
    mockedSupabase().auth.signUp.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  it('signs up with the custom-scheme auth callback redirect', async () => {
    await signUpWithEmail('ada@example.com', 'password123')

    expect(mockedSupabase().auth.signUp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'naksha://auth/callback',
        data: {},
      },
    })
  })

  it('resends signup email with the custom-scheme auth callback redirect', async () => {
    await resendSignupEmail('ada@example.com')

    expect(mockedSupabase().auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'ada@example.com',
      options: {
        emailRedirectTo: 'naksha://auth/callback',
      },
    })
  })

  it('requests password reset email with the custom-scheme auth callback redirect', async () => {
    const result = await requestPasswordResetEmail('ada@example.com')

    expect(result).toEqual({ data: null, error: null })
    expect(
      mockedSupabase().auth.resetPasswordForEmail
    ).toHaveBeenCalledWith('ada@example.com', {
      redirectTo: 'naksha://auth/callback',
    })
  })
})
