/**
 * Best-effort plain text for SpeechSynthesis: strip common Markdown syntax
 * so symbols like fences and emphasis are not read aloud verbatim.
 */
export function markdownToSpeechText(md: string): string {
  let s = md.replace(/\r\n/g, '\n')

  // Fenced code blocks (non-greedy; allow optional language line)
  s = s.replace(/```[\w-]*\n[\s\S]*?```/g, ' ')
  s = s.replace(/```[\s\S]*?```/g, ' ')

  // Reference-style links: [text][id] — leave inner text only after bracket pass
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')

  // Inline code
  s = s.replace(/`([^`]+)`/g, '$1')

  // Bold / italic (simple, non-nested)
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')

  // ATX headings
  s = s.replace(/^#{1,6}\s+/gm, '')

  // Blockquote prefix
  s = s.replace(/^>\s?/gm, '')

  // Lists
  s = s.replace(/^\s*[-*+]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')

  // Horizontal rule lines
  s = s.replace(/^[-*_]{3,}\s*$/gm, ' ')

  // Table pipes — drop pipes, leave cell-ish text
  s = s.replace(/\|/g, ' ')

  // Remaining stray emphasis markers commonly left empty
  s = s.replace(/^\s*[>*_`]+\s*/gm, '')

  s = s.replace(/[`*#~]{2,}/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()

  return s || ''
}
