declare module 'react-test-renderer' {
  import type { ReactElement } from 'react'

  export type ReactTestRenderer = {
    unmount(): void
    update(element: ReactElement): void
    toJSON(): unknown
  }

  export function create(element: ReactElement): ReactTestRenderer
  export function act<T>(callback: () => T | Promise<T>): Promise<T>

  const TestRenderer: {
    act: typeof act
    create: typeof create
  }

  export default TestRenderer
}
