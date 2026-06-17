import supabase from './supabase'

const DELETE_ACCOUNT_FUNCTION = 'delete-account'

export async function deleteAccount() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(
      sessionError.message || 'Could not confirm your current session.'
    )
  }

  if (!session?.access_token) {
    throw new Error('You need to be signed in to delete your account.')
  }

  const { error } = await supabase.functions.invoke(DELETE_ACCOUNT_FUNCTION, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    throw new Error(
      error.message || 'Could not delete your account. Please try again.'
    )
  }
}
