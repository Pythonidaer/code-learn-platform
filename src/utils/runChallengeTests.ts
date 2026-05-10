import type { CodingTestCase } from '../types/challenge'

export interface ChallengeTestResult {
  name: string
  passed: boolean
  expected: unknown
  actual: unknown | undefined
  error?: string
  explanation?: string
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (Array.isArray(a) || Array.isArray(b)) return false

  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const keysA = Object.keys(ao)
  const keysB = Object.keys(bo)
  if (keysA.length !== keysB.length) return false
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false
    if (!deepEqual(ao[k], bo[k])) return false
  }
  return true
}

function matchesExpected(actual: unknown, expected: unknown): boolean {
  return deepEqual(actual, expected)
}

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a
      if (a instanceof Error) return `${a.name}: ${a.message}`
      try {
        return JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
}

export type ConsoleCaptureLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface CapturedConsoleLine {
  level: ConsoleCaptureLevel
  text: string
}

export interface RunChallengeTestsOutput {
  results: ChallengeTestResult[]
  consoleLines: CapturedConsoleLine[]
}

const CONSOLE_TAP_METHODS: readonly ConsoleCaptureLevel[] = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
]

function installConsoleTap(
  onLine: (level: ConsoleCaptureLevel, args: unknown[]) => void,
): () => void {
  const originals: Partial<Record<ConsoleCaptureLevel, (...a: unknown[]) => void>> =
    {}
  for (const method of CONSOLE_TAP_METHODS) {
    const orig = console[method].bind(console) as (...a: unknown[]) => void
    originals[method] = orig
    ;(console as unknown as Record<string, (...a: unknown[]) => void>)[method] =
      (...args: unknown[]) => {
        orig(...args)
        onLine(method, args)
      }
  }
  return () => {
    for (const method of CONSOLE_TAP_METHODS) {
      const orig = originals[method]
      if (orig) {
        ;(console as unknown as Record<string, typeof orig>)[method] = orig
      }
    }
  }
}

/**
 * Runs user JavaScript followed by each test `code` block as an IIFE body.
 * Test code should use `return` for the value to compare to `expected`.
 * Async results (Promises) are awaited once.
 *
 * `console.log` / `info` / `warn` / `error` / `debug` from user or test code
 * are forwarded to the real console and mirrored in `consoleLines`.
 *
 * Not a secure sandbox—local learning only; replace with a backend runner for production.
 */
export async function runChallengeTests(
  userCode: string,
  testCases: CodingTestCase[],
): Promise<RunChallengeTestsOutput> {
  const consoleLines: CapturedConsoleLine[] = []
  const restoreConsole = installConsoleTap((level, args) => {
    consoleLines.push({ level, text: formatConsoleArgs(args) })
  })

  const results: ChallengeTestResult[] = []
  try {
    for (const tc of testCases) {
      try {
        const wrapped = `${userCode}\n\n;return (async function() {\n${tc.code}\n})();`
        const fn = new Function(wrapped)
        const actual = await Promise.resolve(fn())

        const passed = matchesExpected(actual, tc.expected)
        results.push({
          name: tc.name,
          passed,
          expected: tc.expected,
          actual,
          explanation: tc.explanation,
        })
      } catch (e) {
        results.push({
          name: tc.name,
          passed: false,
          expected: tc.expected,
          actual: undefined,
          error: e instanceof Error ? e.message : String(e),
          explanation: tc.explanation,
        })
      }
    }
    return { results, consoleLines }
  } finally {
    restoreConsole()
  }
}

export function allTestsPassed(results: ChallengeTestResult[]): boolean {
  return results.length > 0 && results.every((r) => r.passed)
}

export function summarizeTestResults(results: ChallengeTestResult[]): string {
  if (results.length === 0) return 'No tests were run.'
  const passed = results.filter((r) => r.passed).length
  const lines = results.map((r) => {
    if (r.passed) return `- ${r.name}: passed`
    if (r.error)
      return `- ${r.name}: error — ${r.error}`
    return `- ${r.name}: failed — expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`
  })
  return `Results: ${passed}/${results.length} passed.\n${lines.join('\n')}`
}
