import { deleteAccount } from '../accountDeletion'
import supabase from '../supabase'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}))

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getSession: jest.Mock
    }
    functions: {
      invoke: jest.Mock
    }
  }
}

describe('deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSupabase().auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'session-token-1',
        },
      },
      error: null,
    })
    mockedSupabase().functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    })
  })

  it('throws when there is no active session', async () => {
    mockedSupabase().auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    await expect(deleteAccount()).rejects.toThrow(
      'You need to be signed in to delete your account.'
    )
    expect(mockedSupabase().functions.invoke).not.toHaveBeenCalled()
  })

  it('invokes the delete-account function with the current access token', async () => {
    await deleteAccount()

    expect(mockedSupabase().functions.invoke).toHaveBeenCalledWith(
      'delete-account',
      {
        headers: {
          Authorization: 'Bearer session-token-1',
        },
      }
    )
  })

  it('throws a meaningful message when the function fails', async () => {
    mockedSupabase().functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Could not delete account.' },
    })

    await expect(deleteAccount()).rejects.toThrow('Could not delete account.')
  })
})
