import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../context/ProgressProvider'
import { AITutorPanel } from './AITutorPanel'
import type { CodingChallenge } from '../types/challenge'
import { clearAllAiTutorCache, setAiTutorThread } from '../utils/progressStorage'

vi.mock('../ai/askAI', () => ({
  askAI: vi.fn(),
}))

import { askAI } from '../ai/askAI'

const mockedAskAI = vi.mocked(askAI)

const codingChallenge = {
  id: 'tutor-test-challenge',
  type: 'coding',
  title: 'Test challenge',
  category: 'JavaScript',
  difficulty: 'easy',
  functionName: 'noop',
  prompt: 'Prompt',
  starterCode: '//',
  solutionCode: '//',
  explanation: '',
  testCases: [],
} satisfies CodingChallenge

function Wrapper({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>
}

type UtterLite = {
  text: string
  rate: number
  voice: SpeechSynthesisVoice | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function installSpeechSynthesisPolyfill() {
  ;(
    globalThis as unknown as { SpeechSynthesisUtterance: new (text?: string) => UtterLite }
  ).SpeechSynthesisUtterance = class {
    text = ''
    rate = 1
    voice: SpeechSynthesisVoice | null = null
    onstart: (() => void) | null = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(text?: string) {
      this.text = text ?? ''
    }
  }

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: vi.fn((u: UtterLite) => {
        queueMicrotask(() => {
          u.onstart?.()
          queueMicrotask(() => {
            u.onend?.()
          })
        })
      }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () =>
        [] as unknown as SpeechSynthesisVoice[],
      paused: false,
      pending: false,
      speaking: false,
      onvoiceschanged: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })
}

function removeSpeechSynthesis() {
  delete (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis
  delete (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
}

describe('AITutorPanel speech UI', () => {
  beforeEach(() => {
    mockedAskAI.mockReset()
    clearAllAiTutorCache()
  })

  afterEach(() => {
    cleanup()
    removeSpeechSynthesis()
    clearAllAiTutorCache()
  })

  it('starts without previously cached tutor turns for this challenge', () => {
    setAiTutorThread('tutor-test-challenge', [
      { role: 'user', content: 'Old question' },
      { role: 'assistant', content: 'Old answer' },
    ])
    render(
      <Wrapper>
        <AITutorPanel challenge={codingChallenge} />
      </Wrapper>,
    )

    expect(screen.queryByText('Old question')).not.toBeInTheDocument()
    expect(screen.queryByText('Old answer')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Use the tutor menu or type below/i),
    ).toBeVisible()
  })

  it('shows read-aloud toggle and Speak on assistant replies when SpeechSynthesis exists', async () => {
    installSpeechSynthesisPolyfill()
    mockedAskAI.mockResolvedValue({ text: '**Reply** body' })

    render(
      <Wrapper>
        <AITutorPanel challenge={codingChallenge} />
      </Wrapper>,
    )

    await userEvent.type(screen.getByTestId('ai-tutor-input'), 'Hello')
    await userEvent.click(screen.getByTestId('ai-tutor-send'))
    await screen.findByTestId('ai-tutor-response')

    expect(screen.getByTestId('ai-tutor-read-aloud')).toBeInTheDocument()
    expect(screen.getByTestId('ai-tutor-speak-1')).toBeVisible()
    expect(screen.getByTestId('ai-tutor-voice-select')).toBeInTheDocument()
  })

  it('does not render synthesis toolbar when SpeechSynthesis is unavailable', () => {
    render(
      <Wrapper>
        <AITutorPanel challenge={codingChallenge} />
      </Wrapper>,
    )

    expect(screen.queryByTestId('ai-tutor-read-aloud')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Spoken playback is not available in this browser/i),
    ).toBeVisible()
  })

  it('supports typed sends without SpeechRecognition APIs', async () => {
    installSpeechSynthesisPolyfill()
    ;(
      window as Window & {
        SpeechRecognition?: unknown
        webkitSpeechRecognition?: unknown
      }
    ).SpeechRecognition = undefined
    ;(
      window as Window & {
        SpeechRecognition?: unknown
        webkitSpeechRecognition?: unknown
      }
    ).webkitSpeechRecognition = undefined

    mockedAskAI.mockResolvedValue({ text: 'Typed chat ok' })

    render(
      <Wrapper>
        <AITutorPanel challenge={codingChallenge} />
      </Wrapper>,
    )

    expect(screen.queryByTestId('ai-tutor-mic')).not.toBeInTheDocument()

    await userEvent.type(screen.getByTestId('ai-tutor-input'), 'Typing only')
    await userEvent.click(screen.getByTestId('ai-tutor-send'))

    expect(await screen.findByText('Typed chat ok')).toBeVisible()
    expect(mockedAskAI).toHaveBeenCalledOnce()
  })
})
