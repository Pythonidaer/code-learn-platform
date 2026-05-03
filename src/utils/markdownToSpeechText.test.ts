import { describe, expect, it } from 'vitest'
import { markdownToSpeechText } from './markdownToSpeechText'

describe('markdownToSpeechText', () => {
  it('strips fenced code blocks', () => {
    expect(
      markdownToSpeechText('Say ```js\nx = 1\n``` aloud.'),
    ).toBe('Say aloud.')
  })

  it('flattens inline code', () => {
    expect(markdownToSpeechText('Use the `push` method.')).toBe(
      'Use the push method.',
    )
  })

  it('turns Markdown links into link text only', () => {
    expect(
      markdownToSpeechText('See [the guide](https://example.com/page).'),
    ).toBe('See the guide.')
  })

  it('removes common emphasis markers', () => {
    expect(markdownToSpeechText('**Bold** and *italic*')).toBe('Bold and italic')
  })

  it('drops heading prefixes', () => {
    expect(markdownToSpeechText('## Subtitle')).toBe('Subtitle')
  })
})
