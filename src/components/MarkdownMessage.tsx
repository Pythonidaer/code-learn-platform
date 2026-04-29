import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './MarkdownMessage.module.css'

interface Props {
  content: string
}

export function MarkdownMessage({ content }: Props) {
  return (
    <div className={styles.md}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const isBlock = match != null
            if (isBlock) {
              return (
                <pre className={styles.pre}>
                  <code className={styles.codeBlock} {...props}>
                    {children}
                  </code>
                </pre>
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
