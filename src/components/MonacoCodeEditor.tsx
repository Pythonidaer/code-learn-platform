import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as MonacoNS from 'monaco-editor'
import type { editor as MEditor } from 'monaco-editor'
import styles from './MonacoCodeEditor.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  language: 'javascript' | 'typescript'
  /** Fill parent flex column (workspace editor stack). */
  flexHeight?: boolean
  /** 1-based editor line to highlight for step tracing; null clears decoration. */
  highlightedTraceLine?: number | null
}

export function MonacoCodeEditor({
  value,
  onChange,
  language,
  flexHeight = false,
  highlightedTraceLine = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof MonacoNS | null>(null)
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
        },
      },
    ])
  }, [highlightedTraceLine])

  useEffect(() => {
    return () => {
      const ed = editorRef.current
      if (ed)
        traceDecoRef.current = ed.deltaDecorations(traceDecoRef.current, [])
    }
  }, [])

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed
    monacoRef.current = monaco
    resizeObsCleanup.current?.()
    resizeObsCleanup.current = null

    const compilerOpts = {
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      lib: ['es2022', 'dom'],
    }
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOpts)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOpts)
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
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
