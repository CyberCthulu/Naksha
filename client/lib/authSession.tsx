import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import supabase from './supabase'

export type AuthSessionStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'bootstrap-error'

type AuthSessionState = {
  status: AuthSessionStatus
  user: User | null
}

export type PostAuthRoute = 'ResetPassword'

type AuthSessionContextValue = AuthSessionState & {
  postAuthRoute: PostAuthRoute | null
  retryBootstrap: () => void
  adoptSession: (session: Session | null) => void
  forceSignedOut: () => void
  preparePostAuthRoute: (route: PostAuthRoute) => void
  clearPostAuthRoute: () => void
  getPostAuthRoute: () => PostAuthRoute | null
}

const defaultContext: AuthSessionContextValue = {
  status: 'initializing',
  user: null,
  postAuthRoute: null,
  retryBootstrap: () => undefined,
  adoptSession: () => undefined,
  forceSignedOut: () => undefined,
  preparePostAuthRoute: () => undefined,
  clearPostAuthRoute: () => undefined,
  getPostAuthRoute: () => null,
}

export const AuthSessionContext =
  createContext<AuthSessionContextValue>(defaultContext)

function stateForSession(session: Session | null): AuthSessionState {
  return session?.user
    ? { status: 'authenticated', user: session.user }
    : { status: 'unauthenticated', user: null }
}

export function useAuthSessionController(): AuthSessionContextValue {
  const [state, setState] = useState<AuthSessionState>({
    status: 'initializing',
    user: null,
  })
  const [postAuthRoute, setPostAuthRoute] = useState<PostAuthRoute | null>(null)
  const postAuthRouteRef = useRef<PostAuthRoute | null>(null)
  const mountedRef = useRef(false)
  const bootstrapAttemptRef = useRef(0)
  const authEventRevisionRef = useRef(0)

  const setPreparedPostAuthRoute = useCallback(
    (route: PostAuthRoute | null) => {
      postAuthRouteRef.current = route
      setPostAuthRoute(route)
    },
    []
  )

  const adoptSession = useCallback((session: Session | null) => {
    authEventRevisionRef.current += 1
    bootstrapAttemptRef.current += 1
    if (!session) setPreparedPostAuthRoute(null)
    if (mountedRef.current) setState(stateForSession(session))
  }, [setPreparedPostAuthRoute])

  const forceSignedOut = useCallback(() => {
    setPreparedPostAuthRoute(null)
    adoptSession(null)
  }, [adoptSession, setPreparedPostAuthRoute])

  const preparePostAuthRoute = useCallback((route: PostAuthRoute) => {
    setPreparedPostAuthRoute(route)
  }, [setPreparedPostAuthRoute])

  const clearPostAuthRoute = useCallback(() => {
    setPreparedPostAuthRoute(null)
  }, [setPreparedPostAuthRoute])

  const getPostAuthRoute = useCallback(() => postAuthRouteRef.current, [])

  const retryBootstrap = useCallback(() => {
    const attempt = ++bootstrapAttemptRef.current
    const startingAuthRevision = authEventRevisionRef.current

    setState({ status: 'initializing', user: null })

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (
          !mountedRef.current ||
          bootstrapAttemptRef.current !== attempt ||
          authEventRevisionRef.current !== startingAuthRevision
        ) {
          return
        }

        setState(stateForSession(data.session))
      } catch {
        if (
          !mountedRef.current ||
          bootstrapAttemptRef.current !== attempt ||
          authEventRevisionRef.current !== startingAuthRevision
        ) {
          return
        }

        console.warn('Session bootstrap failed.')
        setState({ status: 'bootstrap-error', user: null })
      }
    })()
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // PKCE recovery callbacks can contain only a code. The auth event is the
      // authoritative signal that the new session must open password reset.
      if (event === 'PASSWORD_RECOVERY') {
        preparePostAuthRoute('ResetPassword')
      }
      adoptSession(session)
    })

    retryBootstrap()

    return () => {
      mountedRef.current = false
      bootstrapAttemptRef.current += 1
      data.subscription.unsubscribe()
    }
  }, [adoptSession, preparePostAuthRoute, retryBootstrap])

  return useMemo(
    () => ({
      ...state,
      postAuthRoute,
      retryBootstrap,
      adoptSession,
      forceSignedOut,
      preparePostAuthRoute,
      clearPostAuthRoute,
      getPostAuthRoute,
    }),
    [
      adoptSession,
      clearPostAuthRoute,
      forceSignedOut,
      getPostAuthRoute,
      postAuthRoute,
      preparePostAuthRoute,
      retryBootstrap,
      state,
    ]
  )
}

export function AuthSessionProvider({
  value,
  children,
}: {
  value: AuthSessionContextValue
  children: ReactNode
}) {
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  return useContext(AuthSessionContext)
}
