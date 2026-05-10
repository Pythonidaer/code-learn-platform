import { parse } from '@babel/parser'
import generateModule from '@babel/generator'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import type { NodePath, Scope } from '@babel/traverse'
import type { CodingTestCase } from '../types/challenge'
import type { TraceRunResult, TraceStep, TraceEventType } from '../types/trace'
import { buildFullSnapshot, filterTraceVariables } from './traceDisplay'
import { deepEqual } from './runChallengeTests'

const TRACE_UNSUPPORTED =
  'Step tracing is not available for this solution yet. Try Run Code instead.'

type Traverse = typeof traverseModule
type Generator = typeof generateModule

/** Bundlers often wrap `@babel/*` CJS defaults as `{ default: fn }` — unwrap for runtime */
function babelDefaultCallable<T extends (...args: never[]) => unknown>(
  mod: unknown,
): T {
  let cur: unknown = mod
  for (let i = 0; i < 5; i++) {
    if (typeof cur === 'function') return cur as T
    if (
      cur !== null &&
      typeof cur === 'object' &&
      'default' in (cur as object)
    ) {
      cur = (cur as { default: unknown }).default
      continue
    }
    break
  }
  throw new TypeError('Expected Babel module default callable')
}

const traverse = babelDefaultCallable<Traverse>(traverseModule)
const generate = babelDefaultCallable<Generator>(generateModule)

function randomSuffix(): string {
  try {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      const s = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      return /^[a-z]/i.test(s) ? s : `_${s}`
    }
  } catch {
    /* Non-secure contexts or older runtimes */
  }
  const s = Math.random().toString(36).slice(2, 14)
  return /^[a-z]/i.test(s) ? s : `_${s}`
}

/** Compact inline stringifier mirrored from safeStringify (runtime cannot import modules). */
function buildRuntimeStringifier(strFnName: string): string {
  return `
function ${strFnName}(value) {
  var maxDepth = 8;
  var maxKeys = 60;
  var maxArr = 80;
  var maxStrLen = 2000;
  var seen = typeof WeakSet === 'undefined' ? null : new WeakSet();
  function walk(v, depth) {
    if (v === null || v === undefined) return v;
    var tp = typeof v;
    if (tp === 'string') return v.length > maxStrLen ? v.slice(0, maxStrLen) + '…' : v;
    if (tp === 'number' || tp === 'boolean') return v;
    if (tp === 'bigint') return String(v) + 'n';
    if (tp === 'symbol')
      return v.description ? 'Symbol(' + v.description + ')' : 'Symbol()';
    if (tp === 'function')
      return '[Function ' + (v.name ? v.name : 'anonymous') + ']';
    if (tp !== 'object') return String(v);
    if (!seen) return '[Object]';
    if (seen.has(v)) return '[Circular]';
    if (depth >= maxDepth) return '[MaxDepth]';
    if (Array.isArray(v)) {
      seen.add(v);
      var slice = v.slice(0, maxArr);
      var mapped = slice.map(function (x) {
        return walk(x, depth + 1);
      });
      if (v.length > maxArr)
        mapped.push('… (+' + String(v.length - maxArr) + ' more)');
      return mapped;
    }
    seen.add(v);
    var keys = Object.keys(v).sort();
    var out = {};
    var n = keys.length > maxKeys ? maxKeys : keys.length;
    for (var i = 0; i < n; i++) {
      var key = keys[i];
      try {
        out[key] = walk(v[key], depth + 1);
      } catch (_) {
        out[key] = '[unreadable]';
      }
    }
    if (keys.length > maxKeys)
      out['…'] = '+' + String(keys.length - maxKeys) + ' more keys';
    return out;
  }
  try {
    return JSON.stringify(walk(value, 0));
  } catch (_) {
    return '"[unserializable]"';
  }
}
`
}

function buildPrelude(suffix: string): {
  prelude: string
  stepsGlobalKey: string
  emitId: string
} {
  const stepsVar = `__clpSteps_${suffix}`
  const idVar = `__clpN_${suffix}`
  const strFn = `__clpStr_${suffix}`
  const emitFn = `__clpEmit_${suffix}`
  const stepsGlobalKey = `__clpTraceRead_${suffix}`

  const strifier = buildRuntimeStringifier(strFn)

  const prelude = `
${strifier};
var ${stepsVar} = [];
var ${idVar} = 0;
function ${emitFn}(line, eventType, description, snapshotFn, optionalReturnVal) {
  try {
    var vars = {};
    try {
      if (typeof snapshotFn === 'function') {
        var raw = snapshotFn();
        if (raw && typeof raw === 'object') {
          var rk = Object.keys(raw);
          for (var ri = 0; ri < rk.length; ri++) {
            var nk = rk[ri];
            try {
              vars[nk] = ${strFn}(raw[nk]);
            } catch (_x) {
              vars[nk] = '"[error]"';
            }
          }
        }
      }
    } catch (_snap) {}

    var retStr = optionalReturnVal;
    try {
      if (optionalReturnVal !== undefined && eventType === 'return') {
        retStr = ${strFn}(optionalReturnVal);
      } else if (eventType !== 'return') {
        retStr = undefined;
      }
    } catch (_r) {
      retStr = '"[error]"';
    }

    ${stepsVar}.push({
      id: String(${idVar}++),
      lineNumber: typeof line === 'number' ? line : undefined,
      eventType: eventType,
      description: description ? String(description) : '',
      variables: vars,
      returnValue: retStr
    });
  } catch (_) {}
}
globalThis[${JSON.stringify(stepsGlobalKey)}] = function () {
  return ${stepsVar}.slice();
};
`
  return {
    prelude,
    stepsGlobalKey,
    emitId: emitFn,
  }
}

/** Parser plugins shared by all parse attempts. */
const PARSER_PLUGINS = [
  'optionalChaining',
  'nullishCoalescingOperator',
  'logicalAssignment',
  'classProperties',
  'topLevelAwait',
  'numericSeparator',
] as const

function parseWithOptions(
  code: string,
  jsx: boolean,
  sourceType: 'script' | 'module' | 'unambiguous',
): ReturnType<typeof parse> | null {
  try {
    return parse(code, {
      sourceType,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      errorRecovery: false,
      plugins: [...PARSER_PLUGINS, ...(jsx ? (['jsx'] as const) : [])],
    })
  } catch {
    return null
  }
}

/** Try plain JS then JSX; prefer script for challenge-style `function ...` blocks. */
export function parseUserSource(code: string): ReturnType<typeof parse> | null {
  const sourceTypes = ['script', 'module', 'unambiguous'] as const
  for (const jsx of [false, true] as const) {
    for (const st of sourceTypes) {
      const ast = parseWithOptions(code, jsx, st)
      if (ast) return ast
    }
  }
  return null
}

function collectBindingSnapshotNames(scopePath: NodePath<t.Node>): string[] {
  const names = new Set<string>()
  let s: Scope | null = scopePath.scope
  while (s) {
    for (const k of Object.keys(s.bindings)) {
      if (k.startsWith('__clp')) continue
      if (k.startsWith('__trace')) continue
      if (k === 'arguments') continue
      names.add(k)
    }
    s = s.parent
  }
  return Array.from(names).sort()
}

function statementEventType(stmt: NodePath<t.Statement>): TraceEventType {
  if (stmt.isVariableDeclaration()) return 'assignment'
  if (
    stmt.isForStatement() ||
    stmt.isForInStatement() ||
    stmt.isForOfStatement() ||
    stmt.isWhileStatement() ||
    stmt.isDoWhileStatement()
  ) {
    return 'loop'
  }
  if (stmt.isIfStatement()) return 'condition'
  return 'line'
}

function describeCallMemberName(
  callee: NodePath<t.Node>,
): string | null {
  if (!callee.isExpression()) return null
  const ex = callee as NodePath<t.Expression>
  if (ex.isMemberExpression()) {
    const p = ex.get('property')
    if (p.isIdentifier()) return p.node.name
    if (p.isStringLiteral()) return p.node.value
  }
  return null
}

function describeExpressionStatement(
  stmt: NodePath<t.ExpressionStatement>,
): string {
  const e = stmt.get('expression')
  if (e.isCallExpression()) {
    const calleeHead = e.get('callee')
    const member = describeCallMemberName(calleeHead)
    if (member === 'set')
      return 'Stored a value in the map under a key.'
    if (member === 'has')
      return 'Checked whether the map contains a key.'
    if (member === 'get')
      return 'Read a value from the map.'
    if (member === 'push')
      return 'Pushed a value onto an array.'
    if (member === 'pop')
      return 'Popped from an array or stack.'
    if (t.isIdentifier(calleeHead.node) && calleeHead.node.name === 'console.log')
      return 'Logged a value to the console.'
    return 'Called a function.'
  }
  if (e.isAssignmentExpression()) return 'Updated a variable with a new value.'
  if (e.isUpdateExpression()) return 'Updated a counter or index.'
  return 'Evaluated an expression on this line.'
}

function statementDesc(stmt: NodePath<t.Statement>): string {
  if (stmt.isVariableDeclaration()) {
    const names: string[] = []
    for (const d of stmt.node.declarations) {
      if (t.isIdentifier(d.id)) names.push(d.id.name)
    }
    if (
      names.length > 0 &&
      names.every(
        (n) =>
          n.startsWith('__clp') ||
          n.startsWith('__trace') ||
          /^__clpRv_/i.test(n),
      )
    ) {
      return 'Computed return value.'
    }
    const first = stmt.node.declarations[0]
    const init = first?.init
    if (names.length === 1 && init) {
      if (t.isObjectExpression(init) && init.properties.length === 0)
        return `Declared ${names[0]} as an empty object.`
      if (
        t.isNewExpression(init) &&
        t.isIdentifier(init.callee) &&
        init.callee.name === 'Map'
      )
        return `Created a new Map (${names[0]}).`
      if (t.isArrayExpression(init) && init.elements.length === 0)
        return `Declared ${names[0]} as an empty array.`
      if (t.isIdentifier(init)) {
        return `Declared ${names[0]} using ${init.name}.`
      }
      if (
        t.isBinaryExpression(init) &&
        (init.operator === '-' || init.operator === '+')
      ) {
        return `Computed ${names[0]} with arithmetic on this line.`
      }
    }
    if (names.length > 0)
      return `Declared ${names.join(', ')}.`
    return 'Declared new variables.'
  }
  if (stmt.isIfStatement()) return 'Evaluated an if condition.'
  if (stmt.isForStatement()) return 'Continued the for loop or ran its header.'
  if (stmt.isForOfStatement()) return 'Continued the for…of loop.'
  if (stmt.isForInStatement()) return 'Continued the for…in loop.'
  if (stmt.isWhileStatement()) return 'Continued the while loop.'
  if (stmt.isDoWhileStatement()) return 'Continued the do…while loop.'
  if (stmt.isExpressionStatement())
    return describeExpressionStatement(stmt)
  return 'Executed a statement.'
}

function snapshotArrow(names: string[]): t.ArrowFunctionExpression {
  if (names.length === 0)
    return t.arrowFunctionExpression(
      [],
      t.objectExpression([]),
    )
  const tryBody = t.blockStatement([
    t.returnStatement(
      t.objectExpression(
        names.map((n) =>
          t.objectProperty(t.identifier(n), t.identifier(n), undefined, true),
        ),
      ),
    ),
  ])
  return t.arrowFunctionExpression(
    [],
    t.blockStatement([
      t.tryStatement(
        tryBody,
        t.catchClause(
          t.identifier('__clpSnapErr'),
          t.blockStatement([
            t.returnStatement(t.objectExpression([])),
          ]),
        ),
      ),
    ]),
  )
}

function makeEmitCall(opts: {
  emitFnId: string
  line: number
  eventType: TraceEventType
  description: string
  snapshotNames: string[]
  optionalReturnExpr?: t.Expression
}) {
  const args: t.Expression[] = [
    t.numericLiteral(opts.line),
    t.stringLiteral(opts.eventType),
    t.stringLiteral(opts.description),
    snapshotArrow(opts.snapshotNames),
  ]
  if (opts.optionalReturnExpr !== undefined) {
    args.push(opts.optionalReturnExpr)
  }
  return t.expressionStatement(
    t.callExpression(t.identifier(opts.emitFnId), args),
  )
}

function insertTraceAfter(stmt: NodePath<t.Statement>, emitFnId: string) {
  const line = stmt.node.loc?.start.line ?? 0
  const ev = statementEventType(stmt)
  const desc = statementDesc(stmt)
  const names = collectBindingSnapshotNames(stmt)
  stmt.insertAfter(
    makeEmitCall({
      emitFnId,
      line,
      eventType: ev,
      description: desc,
      snapshotNames: names,
    }),
  )
}

function returnDescriptionFromArgument(
  arg: t.Expression,
): string {
  if (t.isArrayExpression(arg))
    return 'Returned a result array from the function.'
  if (t.isObjectExpression(arg))
    return 'Returned an object from the function.'
  if (t.isLiteral(arg)) return 'Returned a literal value.'
  if (t.isIdentifier(arg)) return `Returned ${arg.name}.`
  return 'Returned a result from the function.'
}

let rvSeq = 0

function wrapReturnStatement(path: NodePath<t.ReturnStatement>, emitFnId: string) {
  const arg = path.node.argument ?? t.identifier('undefined')
  if (t.isIdentifier(arg) && arg.name.startsWith('__clpRv_')) return

  const line = path.node.loc?.start.line ?? 0
  const rvName = `__clpRv_${rvSeq++}`
  const snapNames = Array.from(
    new Set([...collectBindingSnapshotNames(path), rvName]),
  ).sort()

  const decl = t.variableDeclaration('const', [
    t.variableDeclarator(t.identifier(rvName), arg),
  ])

  const emit = makeEmitCall({
    emitFnId,
    line,
    eventType: 'return',
    description: returnDescriptionFromArgument(arg),
    snapshotNames: snapNames,
    optionalReturnExpr: t.identifier(rvName),
  })

  path.replaceWith(
    t.blockStatement([
      decl,
      emit,
      t.returnStatement(t.identifier(rvName)),
    ]),
  )
}

/** Normalize arrows and loop bodies to blocks so we can probe consistently. */
function normalizeControlFlowBodies(ast: t.File) {
  traverse(ast, {
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      const b = path.get('body')
      if (!b.isBlockStatement()) {
        const expr = b.node as t.Expression
        b.replaceWith(t.blockStatement([t.returnStatement(expr)]))
      }
    },
    ForStatement(path: NodePath<t.ForStatement>) {
      const body = path.get('body') as NodePath<t.Statement>
      if (!body.isBlockStatement())
        body.replaceWith(t.blockStatement([body.node]))
    },
    ForInStatement(path: NodePath<t.ForInStatement>) {
      const body = path.get('body') as NodePath<t.Statement>
      if (!body.isBlockStatement())
        body.replaceWith(t.blockStatement([body.node]))
    },
    ForOfStatement(path: NodePath<t.ForOfStatement>) {
      const body = path.get('body') as NodePath<t.Statement>
      if (!body.isBlockStatement())
        body.replaceWith(t.blockStatement([body.node]))
    },
    WhileStatement(path: NodePath<t.WhileStatement>) {
      const body = path.get('body') as NodePath<t.Statement>
      if (!body.isBlockStatement())
        body.replaceWith(t.blockStatement([body.node]))
    },
    DoWhileStatement(path: NodePath<t.DoWhileStatement>) {
      const body = path.get('body') as NodePath<t.Statement>
      if (!body.isBlockStatement())
        body.replaceWith(t.blockStatement([body.node]))
    },
  })
}

function wrapReturns(ast: t.File, emitFnId: string) {
  const targets: NodePath<t.ReturnStatement>[] = []
  traverse(ast, {
    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      const arg = path.node.argument ?? t.identifier('undefined')
      if (t.isIdentifier(arg) && arg.name.startsWith('__clpRv_')) return
      targets.push(path)
    },
  })
  for (let i = targets.length - 1; i >= 0; i--) {
    wrapReturnStatement(targets[i]!, emitFnId)
  }
}

function isInstrumentationTempDecl(stmtPath: NodePath<t.Statement>): boolean {
  if (!stmtPath.isVariableDeclaration()) return false
  const names: string[] = []
  for (const d of stmtPath.node.declarations) {
    if (t.isIdentifier(d.id)) names.push(d.id.name)
  }
  if (names.length === 0) return false
  return names.every(
    (n) =>
      n.startsWith('__clp') ||
      n.startsWith('__trace') ||
      /^__clpRv_/i.test(n),
  )
}

function isTraceEmitStmt(stmtPath: NodePath<t.Statement>, emitFnId: string): boolean {
  if (!stmtPath.isExpressionStatement()) return false
  const e = stmtPath.get('expression')
  if (!e.isCallExpression()) return false
  const c = e.get('callee')
  return c.isIdentifier() && c.node.name === emitFnId
}

function insertBlockProbes(ast: t.File, emitFnId: string) {
  const blockPaths: NodePath<t.BlockStatement>[] = []
  traverse(ast, {
    BlockStatement: {
      exit(path: NodePath<t.BlockStatement>) {
        blockPaths.push(path)
      },
    },
  })
  for (const path of blockPaths) {
    const bodyPaths = [...path.get('body')]
    for (let i = bodyPaths.length - 1; i >= 0; i--) {
      const stmtPath = bodyPaths[i] as NodePath<t.Statement>
      if (!stmtPath?.node) continue

      if (stmtPath.isReturnStatement()) continue
      if (stmtPath.isBlockStatement()) continue
      if (stmtPath.isFunctionDeclaration()) continue
      if (stmtPath.isClassDeclaration()) continue
      if (isTraceEmitStmt(stmtPath, emitFnId)) continue
      if (isInstrumentationTempDecl(stmtPath)) continue
      insertTraceAfter(stmtPath, emitFnId)
    }
  }
}

export function instrumentJavaScriptSource(
  userCode: string,
): { ok: true; code: string; stepsGlobalKey: string } | { ok: false; message: string } {
  rvSeq = 0
  const ast = parseUserSource(userCode)
  if (!ast) return { ok: false, message: TRACE_UNSUPPORTED }

  try {
    normalizeControlFlowBodies(ast)
    const suffix = randomSuffix()
    const { prelude, stepsGlobalKey, emitId } = buildPrelude(suffix)

    wrapReturns(ast, emitId)
    insertBlockProbes(ast, emitId)
    const out = generate(ast as Parameters<typeof generate>[0], {
      compact: false,
      retainLines: false,
      comments: false,
    })
    if (!out?.code?.trim())
      return { ok: false, message: TRACE_UNSUPPORTED }

    const fullCode = prelude + '\n' + out.code
    return { ok: true, code: fullCode, stepsGlobalKey }
  } catch {
    return { ok: false, message: TRACE_UNSUPPORTED }
  }
}

function readStepsFromGlobal(key: string): Record<string, unknown>[] {
  type StepRow = Record<string, unknown>
  const g = globalThis as unknown as Record<string, unknown>
  const reader = g[key]
  if (typeof reader !== 'function')
    return []
  try {
    const out = (reader as () => unknown)()
    return Array.isArray(out) ? (out as StepRow[]) : []
  } catch {
    return []
  }
}

export async function traceChallengeCode(params: {
  userCode: string
  testCase: CodingTestCase
}): Promise<TraceRunResult> {
  const { userCode, testCase } = params
  const inst = instrumentJavaScriptSource(userCode)
  if (!inst.ok)
    return { ok: false, message: inst.message }

  const wrapped = `${inst.code}\n\n;return (async function() {\n${testCase.code}\n})();`
  let testReturnValue: unknown
  const g = globalThis as unknown as Record<string, unknown>
  const key = inst.stepsGlobalKey

  try {
    const fn = new Function(wrapped)
    testReturnValue = await Promise.resolve(fn())
  } catch (e) {
    const raw = readStepsFromGlobal(key)
    const errMsg = e instanceof Error ? e.message : String(e)
    const normalized = raw
      .map(normalizeScratchStep)
      .filter(Boolean) as TraceStep[]
    normalized.push({
      id: `err_${normalized.length}`,
      stepIndex: 0,
      lineNumber: 0,
      eventType: 'error',
      description: 'Runtime error while stepping',
      visibleValues: {},
      error: errMsg,
    })
    const steps = finalizeTraceSteps(normalized)
    delete g[key]
    return {
      ok: false,
      message: errMsg,
      steps,
    }
  }

  const rawScratch = readStepsFromGlobal(key)
  delete g[key]

  const steps = finalizeTraceSteps(
    rawScratch.map(normalizeScratchStep).filter(Boolean) as TraceStep[],
  )
  const testPassed =
    testCase.expected === undefined ? undefined : deepEqual(testReturnValue, testCase.expected)

  return {
    ok: true,
    steps,
    testReturnValue,
    testPassed,
  }
}

function finalizeTraceSteps(steps: TraceStep[]): TraceStep[] {
  return steps.map((s, i) => ({ ...s, stepIndex: i }))
}

function normalizeScratchStep(
  raw: TraceStep | Record<string, unknown>,
): TraceStep | null {
  const id =
    typeof raw.id === 'string' ? raw.id : String((raw as { id?: unknown }).id ?? '?')
  const lineNumberRaw =
    typeof raw.lineNumber === 'number' ? raw.lineNumber : undefined
  const lineNumber =
    typeof lineNumberRaw === 'number' && lineNumberRaw > 0 ? lineNumberRaw : 0
  const eventType =
    typeof raw.eventType === 'string' &&
    [
      'line',
      'function-call',
      'assignment',
      'loop',
      'condition',
      'return',
      'error',
    ].includes(raw.eventType)
      ? (raw.eventType as TraceEventType)
      : 'line'
  const description =
    typeof raw.description === 'string' ? raw.description : ''

  let variablesRaw: Record<string, unknown> | undefined
  if (raw.variables && typeof raw.variables === 'object')
    variablesRaw = raw.variables as Record<string, unknown>

  const fullSnapshot = buildFullSnapshot(variablesRaw)
  const visibleValues =
    fullSnapshot && Object.keys(fullSnapshot).length > 0
      ? filterTraceVariables(fullSnapshot)
      : {}

  let rv: unknown | undefined =
    'returnValue' in raw ? (raw.returnValue as unknown) : undefined
  if (typeof rv === 'string') {
    try {
      rv = JSON.parse(rv) as unknown
    } catch {
      /* keep string */
    }
  }

  const err =
    typeof raw.error === 'string'
      ? raw.error
      : undefined

  return {
    id,
    stepIndex: 0,
    lineNumber,
    eventType,
    description,
    visibleValues,
    fullSnapshot,
    returnValue: rv,
    error: err,
  }
}
