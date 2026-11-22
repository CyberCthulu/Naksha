import { createContext, useContext, type ReactNode } from 'react'

// Standalone loaders (including app bootstrap) are active by default. Their
// animation hook still checks AppState and the reduced-motion preference.
const ScreenActivityContext = createContext(true)

export function useScreenActivity() {
  return useContext(ScreenActivityContext)
}

/** Share route visibility with loading indicators without requiring navigation. */
export function ScreenActivityProvider({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  const parentActive = useScreenActivity()

  return (
    <ScreenActivityContext.Provider value={parentActive && active}>
      {children}
    </ScreenActivityContext.Provider>
  )
}
