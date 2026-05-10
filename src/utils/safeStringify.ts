const DEFAULT_MAX_DEPTH = 8
const DEFAULT_MAX_KEYS = 60
const DEFAULT_MAX_ARRAY = 80
const DEFAULT_MAX_STRING = 2000

export type SafeStringifyOptions = {
  maxDepth?: number
  maxKeysPerObject?: number
  maxArrayLength?: number
  maxStringLength?: number
}

/**
 * JSON-like string for snapshots; avoids throwing on cycles and truncates deeply
 * nested or very large structures.
 */
export function safeStringify(
  value: unknown,
  options: SafeStringifyOptions = {},
): string {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
  const maxKeys = options.maxKeysPerObject ?? DEFAULT_MAX_KEYS
  const maxArr = options.maxArrayLength ?? DEFAULT_MAX_ARRAY
  const maxStr = options.maxStringLength ?? DEFAULT_MAX_STRING
  const seen = new WeakSet<object>()

  function walk(v: unknown, depth: number): unknown {
    if (v === null || v === undefined) return v
    if (typeof v === 'string') {
      const s = v
      return s.length > maxStr ? `${s.slice(0, maxStr)}…` : s
    }
    if (typeof v === 'number' || typeof v === 'boolean') return v
    if (typeof v === 'bigint') return `${String(v)}n`
    if (typeof v === 'symbol') {
      const sym = v
      return sym.description ? `Symbol(${sym.description})` : 'Symbol()'
    }
    if (typeof v === 'function') {
      const fn = v as { name?: string }
      return `[Function ${fn.name || 'anonymous'}]`
    }

    if (typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]'
      if (depth >= maxDepth) return '[MaxDepth]'
      if (Array.isArray(v)) {
        seen.add(v)
        const slice = v.slice(0, maxArr)
        const mapped = slice.map((x) => walk(x, depth + 1))
        if (v.length > maxArr)
          mapped.push(`… (+${v.length - maxArr} more)` as unknown as never)
        return mapped
      }
      seen.add(v as object)
      const o = v as Record<string, unknown>
      const keys = Object.keys(o).sort()
      const out: Record<string, unknown> = {}
      const n = Math.min(keys.length, maxKeys)
      for (let i = 0; i < n; i++) {
        const k = keys[i]
        if (!k) continue
        try {
          out[k] = walk(o[k], depth + 1)
        } catch {
          out[k] = '[unreadable]'
        }
      }
      if (keys.length > maxKeys)
        out['…'] = `+${keys.length - maxKeys} more keys`
      return out
    }
    return String(v)
  }

  try {
    return JSON.stringify(walk(value, 0))
  } catch {
    return '"[unserializable]"'
  }
}
