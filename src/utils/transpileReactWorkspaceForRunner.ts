import { transform } from '@babel/standalone'

/**
 * Strips `import … from 'react'` (workspace cannot execute as a real ES module)
 * and compiles JSX to `React.createElement` for the eval-based test runner.
 */
export function transpileReactWorkspaceForRunner(source: string): string {
  let s = stripReactImports(source)
  s = stripExportDeclarations(s)

  const result = transform(s, {
    filename: 'clp-workspace.jsx',
    presets: [
      [
        'react',
        {
          runtime: 'classic',
          pragma: 'React.createElement',
          pragmaFrag: 'React.Fragment',
        },
      ],
    ],
  })
  if (!result.code) {
    throw new Error('Could not compile React workspace for tests.')
  }
  return result.code
}

function stripReactImports(source: string): string {
  return source
    .replace(/^\s*import\s+[\s\S]*?from\s+['"]react['"]\s*;?\s*/gm, '')
    .replace(/^\s*import\s+['"]react['"]\s*;?\s*/gm, '')
}

/** `export` is invalid inside `new Function` / `AsyncFunction` bodies. */
function stripExportDeclarations(source: string): string {
  return source
    .replace(/^\s*export\s+default\s+function\s+/gm, 'function ')
    .replace(/^\s*export\s+function\s+/gm, 'function ')
    .replace(/^\s*export\s+default\s+class\s+/gm, 'class ')
    .replace(/^\s*export\s+class\s+/gm, 'class ')
    .replace(/^\s*export\s+default\s+const\s+/gm, 'const ')
    .replace(/^\s*export\s+const\s+/gm, 'const ')
    .replace(/^\s*export\s+default\s+let\s+/gm, 'let ')
    .replace(/^\s*export\s+let\s+/gm, 'let ')
    .replace(/^\s*export\s+default\s+\w+\s*;?\s*$/gm, '')
}
