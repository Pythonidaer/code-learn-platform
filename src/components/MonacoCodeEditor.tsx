import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor as MEditor } from 'monaco-editor'
import type { MonacoWorkspaceLanguage } from '../utils/monacoChallengeLanguage'
import {
  MONACO_REACT_EXTRA_LIB,
  MONACO_REACT_EXTRA_LIB_FILE,
  MONACO_REACT_JSX_RUNTIME_LIB,
  MONACO_REACT_JSX_RUNTIME_LIB_FILE,
} from '../utils/monacoReactExtraLib'
import styles from './MonacoCodeEditor.module.css'

type MonacoBundle = typeof import('monaco-editor')

/** Ambient React typings are registered once per page load (Monaco shared worker). */
let monacoReactAmbientRegistered = false

interface Props {
  value: string
  onChange: (value: string) => void
  language: MonacoWorkspaceLanguage
  /**
   * Virtual path for the document model (see `monacoModelPathForChallenge`).
   * A `.jsx` path lets the TS worker parse JSX while `language` stays `javascript` for syntax colors.
   */
  modelPath: string
  /** Fill parent flex column (workspace editor stack). */
  flexHeight?: boolean
  /** 1-based editor line to highlight for step tracing; null clears decoration. */
  highlightedTraceLine?: number | null
}

export function MonacoCodeEditor({
  value,
  onChange,
  language,
  modelPath,
  flexHeight = false,
  highlightedTraceLine = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<MonacoBundle | null>(null)
  const traceDecoRef = useRef<string[]>([])
  const resizeObsCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      resizeObsCleanup.current?.()
      resizeObsCleanup.current = null
    }
  }, [])

  useEffect(() => {
    const ed = editorRef.current
    const monaco = monacoRef.current
    if (!ed || !monaco) return
    const line = highlightedTraceLine
    const model = ed.getModel()
    if (!model || line == null || line <= 0) {
      traceDecoRef.current = ed.deltaDecorations(traceDecoRef.current, [])
      return
    }
    const maxCol = Math.max(model.getLineMaxColumn(line), 1)
    traceDecoRef.current = ed.deltaDecorations(traceDecoRef.current, [
      {
        range: new monaco.Range(line, 1, line, maxCol),
        options: {
          isWholeLine: true,
          className: 'clpTraceCurrentLine',
          lineNumberClassName: 'clpTraceLineNumber',
        },
      },
    ])
  }, [highlightedTraceLine])

  useEffect(() => {
    return () => {
      const ed = editorRef.current
      if (ed) {
        traceDecoRef.current = ed.deltaDecorations(traceDecoRef.current, [])
      }
    }
  }, [])

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed
    monacoRef.current = monaco
    resizeObsCleanup.current?.()
    resizeObsCleanup.current = null

    const ts = monaco.languages.typescript
    const jsxEnum = ts.JsxEmit as
      | { React?: number; ReactJSX?: number }
      | undefined
    const jsxEmit =
      jsxEnum?.ReactJSX ?? jsxEnum?.React ?? 4
    const modResEnum = ts.ModuleResolutionKind as
      | { NodeJs?: number; Node10?: number }
      | undefined
    const moduleResolution =
      modResEnum?.NodeJs ?? modResEnum?.Node10 ?? 2

    const compilerOpts = {
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution,
      jsx: jsxEmit,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      lib: ['es2022', 'dom'],
    }

    if (!monacoReactAmbientRegistered) {
      monacoReactAmbientRegistered = true
      ts.javascriptDefaults.addExtraLib(
        MONACO_REACT_EXTRA_LIB,
        MONACO_REACT_EXTRA_LIB_FILE,
      )
      ts.javascriptDefaults.addExtraLib(
        MONACO_REACT_JSX_RUNTIME_LIB,
        MONACO_REACT_JSX_RUNTIME_LIB_FILE,
      )
      ts.typescriptDefaults.addExtraLib(
        MONACO_REACT_EXTRA_LIB,
        MONACO_REACT_EXTRA_LIB_FILE,
      )
      ts.typescriptDefaults.addExtraLib(
        MONACO_REACT_JSX_RUNTIME_LIB,
        MONACO_REACT_JSX_RUNTIME_LIB_FILE,
      )
    }

    ts.javascriptDefaults.setCompilerOptions(compilerOpts)
    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    ts.typescriptDefaults.setCompilerOptions(compilerOpts)
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    if (flexHeight && wrapRef.current) {
      const wrap = wrapRef.current
      const ro = new ResizeObserver(() => {
        ed.layout()
      })
      ro.observe(wrap)
      resizeObsCleanup.current = () => {
        ro.disconnect()
      }
      queueMicrotask(() => ed.layout())
    }
  }

  return (
    <div
      ref={wrapRef}
      className={flexHeight ? `${styles.wrap} ${styles.wrapFlex}` : styles.wrap}
      data-testid="monaco-editor"
    >
      <Editor
        height={flexHeight ? '100%' : 'min(480px, 55vh)'}
        language={language}
        path={modelPath}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 8 },
        }}
      />
    </div>
  )
}
