import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { markdownToSpeechText } from '../utils/markdownToSpeechText'
import {
  clampSpeechRate,
  getStoredSpeechRate,
  getStoredSpeechVoiceUri,
  setStoredSpeechRate,
  setStoredSpeechVoiceUri,
} from '../utils/speechPrefsStorage'

export interface UseSpeechSynthesisResult {
  isSupported: boolean
  isSpeaking: boolean
  speakingMessageId: string | null
  speak: (text: string, messageId: string) => void
  stop: () => void
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  selectedVoiceUri: string
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void
  rate: number
  setRate: (rate: number) => void
}

function pickVoiceByUri(
  voices: SpeechSynthesisVoice[],
  uri: string,
): SpeechSynthesisVoice | null {
  if (!uri.trim()) return null
  return voices.find((v) => v.voiceURI === uri) ?? null
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    window.speechSynthesis !== null

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  )

  const [voiceUri, setVoiceUri] = useState(() => getStoredSpeechVoiceUri())
  const [rate, setRateState] = useState(() => getStoredSpeechRate())

  const tokenRef = useRef(0)

  const refreshVoices = useCallback(() => {
    if (!window.speechSynthesis) return
    setVoices([...window.speechSynthesis.getVoices()])
  }, [])

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!isSupported || !synth) return

    startTransition(() => {
      refreshVoices()
    })
    synth.addEventListener('voiceschanged', refreshVoices)

    return () => {
      synth.removeEventListener('voiceschanged', refreshVoices)
    }
  }, [isSupported, refreshVoices])

  const selectedVoice = useMemo(
    () => pickVoiceByUri(voices, voiceUri),
    [voices, voiceUri],
  )

  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    if (voice == null) {
      setVoiceUri('')
      setStoredSpeechVoiceUri('')
      return
    }
    setVoiceUri(voice.voiceURI)
    setStoredSpeechVoiceUri(voice.voiceURI)
  }, [])

  const setRate = useCallback((next: number) => {
    const clamped = clampSpeechRate(next)
    setRateState(clamped)
    setStoredSpeechRate(clamped)
  }, [])

  const stop = useCallback(() => {
    if (!isSupported) return
    const synth = window.speechSynthesis
    if (!synth) return
    tokenRef.current += 1
    synth.cancel()
    setIsSpeaking(false)
    setSpeakingMessageId(null)
  }, [isSupported])

  const speak = useCallback(
    (rawText: string, messageId: string) => {
      if (!isSupported) return
      const synth = window.speechSynthesis
      if (!synth) return
      const plain = markdownToSpeechText(rawText)
      if (!plain.trim()) return

      tokenRef.current += 1
      const myToken = tokenRef.current
      synth.cancel()
      setIsSpeaking(false)
      setSpeakingMessageId(null)

      const u = new SpeechSynthesisUtterance(plain)
      u.rate = rate
      const voice = pickVoiceByUri(voices, voiceUri)
      if (voice) {
        u.voice = voice
      }

      u.onstart = () => {
        if (tokenRef.current !== myToken) return
        setIsSpeaking(true)
        setSpeakingMessageId(messageId)
      }
      const end = () => {
        if (tokenRef.current !== myToken) return
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      }
      u.onend = end
      u.onerror = end

      synth.speak(u)
    },
    [isSupported, rate, voiceUri, voices],
  )

  return {
    isSupported,
    isSpeaking,
    speakingMessageId,
    speak,
    stop,
    voices,
    selectedVoice,
    selectedVoiceUri: voiceUri,
    setSelectedVoice,
    rate,
    setRate,
  }
}
