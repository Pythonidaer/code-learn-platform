/**
 * Minimal ambient typings for the in-browser Monaco TS/JS worker (editor only).
 * Keeps JSX, hooks, and `import from 'react'` from producing false errors.
 * Full `@types/react` is not bundled; runtime still uses the host bundler/React.
 */
export const MONACO_REACT_EXTRA_LIB = `
declare module 'react' {
  export type Key = string | number | bigint
  export type ReactNode = unknown
  export type ReactElement = unknown
  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prevState: S) => S)
  export type FC<P = object> = (props: P) => ReactElement | null

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useRef<T>(initialValue: T): { readonly current: T }
  export function useCallback<T extends (...args: never[]) => unknown>(cb: T, deps: readonly unknown[]): T
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T
  export function useReducer<S, A>(
    reducer: (state: S, action: A) => S,
    initialState: S
  ): [S, Dispatch<A>]

  export const Fragment: unique symbol
  function createElement(...args: unknown[]): unknown
  const React: {
    createElement: typeof createElement
    Fragment: typeof Fragment
  }
  export default React
}
export as namespace React

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>
    }
    type Element = unknown
  }
}
`

/** Virtual path for the synthetic `react` package entry. */
export const MONACO_REACT_EXTRA_LIB_FILE = 'file:///node_modules/react/index.d.ts'

/**
 * Required when `jsx` is `ReactJSX` (automatic runtime): TS injects `react/jsx-runtime`.
 * Without this, Monaco reports TS2875 (module not found).
 */
export const MONACO_REACT_JSX_RUNTIME_LIB = `
declare module 'react/jsx-runtime' {
  export function jsx(
    type: unknown,
    props: unknown,
    key?: unknown,
  ): unknown
  export function jsxs(
    type: unknown,
    props: unknown,
    key?: unknown,
  ): unknown
  export function jsxDEV(
    type: unknown,
    props: unknown,
    key?: unknown | undefined,
    isStaticChildren?: boolean,
    source?: unknown,
    self?: unknown,
  ): unknown
  export const Fragment: unique symbol
}
`

/** Virtual path for \`react/jsx-runtime\` resolution in the TS worker. */
export const MONACO_REACT_JSX_RUNTIME_LIB_FILE =
  'file:///node_modules/react/jsx-runtime.d.ts'
