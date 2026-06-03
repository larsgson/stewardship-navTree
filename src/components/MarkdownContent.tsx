import ReactMarkdown from "react-markdown"

interface Props {
  markdown: string
}

export default function MarkdownContent({ markdown }: Props) {
  return (
    <div className="prose-content">
      <ReactMarkdown
        components={{
          a({ href, children }) {
            const isExternal = href?.startsWith("http")
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
