import { createContext, useContext } from 'react'

export type FormAppearance = 'default' | 'soft'

/** Screen-local presentation; field values and interaction stay independent. */
export const FormAppearanceContext = createContext<FormAppearance>('default')

export function useFormAppearance(): FormAppearance {
  return useContext(FormAppearanceContext)
}
