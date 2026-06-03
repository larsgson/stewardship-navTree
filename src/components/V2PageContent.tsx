import PageSection from "./PageSection"
import MarkdownContent from "./MarkdownContent"
import type { ParsedMarkdown, ImageConfig, V2TreeNode } from "../lib/types"

interface Props {
  basePath: string
  folderPath: string
  title: string
  parsed: ParsedMarkdown
  markdown?: string
  imageConfig: ImageConfig | null
  childNodes: V2TreeNode[]
  prevUrl: string | null
  nextUrl: string | null
  lang: string
}

function getNodeTitle(node: V2TreeNode, lang: string): string {
  return node.meta.locales?.[lang]?.title || node.meta.title
}

export default function V2PageContent({
  basePath,
  folderPath,
  title,
  parsed,
  markdown,
  imageConfig,
  childNodes,
  prevUrl,
  nextUrl,
  lang,
}: Props) {
  const parentPath = folderPath.includes("/")
    ? `${basePath}/${folderPath.substring(0, folderPath.lastIndexOf("/"))}`
    : `${basePath}/`

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <a
          href={parentPath}
          className="text-lg font-bold"
          style={{ color: "var(--text)" }}
        >
          &larr;
        </a>
        <h1 className="text-xl font-bold flex-1">{title}</h1>
      </div>

      {markdown ? (
        <MarkdownContent markdown={markdown} />
      ) : parsed.sections.length > 0 ? (
        <div className="space-y-4">
          {parsed.sections.map((section, index) => (
            <PageSection
              key={index}
              section={section}
              sectionIndex={index}
              onSectionClick={() => {}}
              imageConfig={imageConfig}
              isClickable={false}
            />
          ))}
        </div>
      ) : null}

      {childNodes.length > 0 && (
        <div className="mt-6">
          <div className="chapter-grid">
            {childNodes.map((child) => (
              <a
                key={child.folderPath}
                href={`${basePath}/${child.folderPath}`}
                className="chapter-card"
              >
                <div
                  className="chapter-card-img"
                  style={{ background: "var(--bg-surface)", minHeight: "3rem" }}
                />
                <div className="chapter-card-info">
                  <span className="chapter-card-num">
                    {getNodeTitle(child, lang)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {(prevUrl || nextUrl) && (
        <div className="flex justify-between items-center mt-8 mb-4">
          {prevUrl ? (
            <a
              href={prevUrl}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              &larr; Previous
            </a>
          ) : (
            <div />
          )}
          {nextUrl ? (
            <a
              href={nextUrl}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Next &rarr;
            </a>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  )
}
