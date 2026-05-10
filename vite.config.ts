/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'

// CJS package: Vitest/Vite ESM interop may expose `{ default }` instead of a callable.
const monacoEditorPlugin =
  typeof monacoEditorPluginModule === 'function'
    ? monacoEditorPluginModule
    : (
        monacoEditorPluginModule as {
          default: typeof monacoEditorPluginModule
        }
      ).default

// Monaco bundles editor workers via this plugin (Vite + ESM workers).
// CodeMirror was not needed; this setup avoids manual worker URL wiring.

export default defineConfig(({ mode }) => ({
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(
      mode === 'production' ? 'production' : 'development',
    ),
  },
  /** Production CI/GitHub Pages project-site (`/:repo/`). Dev stays `'/'`. */
  base: mode === 'production' ? '/code-learn-platform/' : '/',
  plugins: [
    react(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'typescript'],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}))
