import { useCallback, useRef, useState } from 'react'

function getCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean
  isListening: boolean
  error: string | null
  start: (baselineInput: string, onText: (next: string) => void) => void
  stop: () => void
}

/**
 * Browser SpeechRecognition (or webkit). Click-to-start / click-to-stop;
 * streams transcript into the callback without auto-submitting.
 */
export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognition | null>(null)
  const baselineRef = useRef('')
  const onTextRef = useRef<(next: string) => void>(() => {})
  /** Incremented on every stop / new start so late onresult after stop() cannot mutate input. */
  const sessionGenRef = useRef(0)

  const stop = useCallback(() => {
    sessionGenRef.current += 1
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setIsListening(false)
  }, [])

  const start = useCallback(
    (baselineInput: string, onText: (next: string) => void) => {
      const K = getCtor()
      if (!K) {
        setError('Voice input is not supported in this browser.')
        return
      }
      stop()
      const sessionGen = sessionGenRef.current
      setError(null)
      baselineRef.current = baselineInput
      onTextRef.current = onText

      const r = new K()
      r.continuous = true
      r.interimResults = true
      r.lang =
        typeof document !== 'undefined' && document.documentElement.lang
          ? document.documentElement.lang
          : 'en-US'

      r.onresult = (event: SpeechRecognitionEvent) => {
        if (sessionGen !== sessionGenRef.current) return
        let chunk = ''
        for (let i = 0; i < event.results.length; i++) {
          chunk += event.results[i]![0]!.transcript
        }
        onTextRef.current(baselineRef.current + chunk)
      }

      r.onerror = (ev: SpeechRecognitionErrorEvent) => {
        if (sessionGen !== sessionGenRef.current) return
        if (ev.error === 'aborted' || ev.error === 'no-speech') return
        const human =
          ev.error === 'not-allowed' || ev.error === 'service-not-allowed'
            ? 'Microphone access was denied. Allow the microphone to use voice input.'
            : ev.error === 'audio-capture'
              ? 'No microphone was found.'
              : `Voice input error: ${ev.error}.`
        setError(human)
      }

      r.onend = () => {
        if (sessionGen !== sessionGenRef.current) return
        recRef.current = null
        setIsListening(false)
      }

      try {
        r.start()
        recRef.current = r
        setIsListening(true)
      } catch {
        setError('Could not start voice input.')
        setIsListening(false)
      }
    },
    [stop],
  )

  return {
    isSupported: Boolean(getCtor()),
    isListening,
    error,
    start,
    stop,
  }
}
