/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AI_TUTOR?: string
  readonly VITE_USE_HASH_ROUTER?: string
  readonly VITE_AI_PROVIDER?: string
  readonly VITE_OLLAMA_URL?: string
  readonly VITE_OLLAMA_MODEL?: string
}
