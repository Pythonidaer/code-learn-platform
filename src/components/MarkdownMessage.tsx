import { createContext, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizeTutorMarkdown } from '../utils/normalizeTutorMarkdown'
import styles from './MarkdownMessage.module.css'

/** True while rendering the inner `code` of a markdown code block (`pre` > `code`). */
const InsidePreContext = createContext(false)

interface Props {
  content: string
  /** Extra classes on the root (merged with markdown shell styles). */
  className?: string
}

function mergeClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function MarkdownMessage({ content, className }: Props) {
  return (
    <div className={mergeClassNames(styles.md, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return (
              <InsidePreContext.Provider value={true}>
                <pre className={styles.pre}>{children}</pre>
              </InsidePreContext.Provider>
            )
          },
          code({ className, children, ...props }) {
            const insidePre = useContext(InsidePreContext)
            if (insidePre) {
              return (
                <code
                  className={mergeClassNames(styles.codeBlock, className)}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          h1: ({ children }) => <h3 className={styles.h}>{children}</h3>,
          h2: ({ children }) => <h3 className={styles.h}>{children}</h3>,
          h3: ({ children }) => <h4 className={styles.h}>{children}</h4>,
          a: ({ href, children }) => (
            <a href={href} className={styles.a} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {normalizeTutorMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}
