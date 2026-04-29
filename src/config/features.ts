/**
 * Feature flags from env.VITE_* (embedded at build time).
 *
 * AI tutor defaults OFF for production builds (GitHub Pages). Locally (`vite`),
 * dev server defaults ON unless `VITE_ENABLE_AI_TUTOR=false`.
 */

/** Prefer `'false'` / `'true'` strings via `.env*` files — avoids coercion quirks */
export const ENABLE_AI_TUTOR =
  !import.meta.env.PROD
    ? String(import.meta.env.VITE_ENABLE_AI_TUTOR ?? 'true').toLowerCase() !==
      'false'
    : String(import.meta.env.VITE_ENABLE_AI_TUTOR ?? 'false').toLowerCase() ===
      'true'

export function routerUsesHash(): boolean {
  return (
    String(import.meta.env.VITE_USE_HASH_ROUTER ?? '').toLowerCase() === 'true'
  )
}
