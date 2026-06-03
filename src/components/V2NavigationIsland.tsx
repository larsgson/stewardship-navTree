import { useState, useCallback } from "react"
import type { V2TreeNode, ImageConfig } from "../lib/types"
import { resolveImageUrl } from "../lib/image-utils"

interface Props {
  bookId: string
  basePath: string
  bookTitle: string
  nodes: V2TreeNode[]
  imageConfig: ImageConfig | null
  lang: string
}

function getNodeTitle(node: V2TreeNode, lang: string): string {
  return node.meta.locales?.[lang]?.title || node.meta.title
}

function TreeNodeCard({
  basePath,
  node,
  imageConfig,
  lang,
}: {
  basePath: string
  node: V2TreeNode
  imageConfig: ImageConfig | null
  lang: string
}) {
  const title = getNodeTitle(node, lang)
  const thumbnail = node.meta.thumbnail
  const href = `${basePath}/${node.folderPath}`

  return (
    <a href={href} className="chapter-card">
      {thumbnail ? (
        <img
          className="chapter-card-img"
          src={resolveImageUrl(thumbnail, imageConfig)}
          alt=""
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      ) : (
        <div
          className="chapter-card-img"
          style={{ background: "var(--bg-surface)", minHeight: "3rem" }}
        />
      )}
      <div className="chapter-card-info">
        <span className="chapter-card-num">{title}</span>
      </div>
    </a>
  )
}

function RecursiveTree({
  basePath,
  nodes,
  imageConfig,
  lang,
  depth,
}: {
  basePath: string
  nodes: V2TreeNode[]
  imageConfig: ImageConfig | null
  lang: string
  depth: number
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggle = useCallback(
    (id: string) => setOpenId((prev) => (prev === id ? null : id)),
    [],
  )

  if (depth === 0) {
    return (
      <div className="chapter-grid">
        {nodes.map((node) => (
          <TreeNodeCard
            key={node.folderPath}
            basePath={basePath}
            node={node}
            imageConfig={imageConfig}
            lang={lang}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      {nodes.map((node) => {
        const title = getNodeTitle(node, lang)
        const hasChildren = node.children.length > 0
        const isOpen = openId === node.folderPath

        if (!hasChildren) {
          return (
            <a
              key={node.folderPath}
              href={`${basePath}/${node.folderPath}`}
              className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {title}
            </a>
          )
        }

        return (
          <div key={node.folderPath} className={`accordion-item${isOpen ? " open" : ""}`}>
            <button className="accordion-header" onClick={() => toggle(node.folderPath)}>
              <div className="accordion-info">
                <span className="accordion-title">{title}</span>
              </div>
              <span className="accordion-chevron">&#x25B8;</span>
            </button>
            <div className="accordion-body">
              <div className="accordion-body-inner">
                {node.hasContent && (
                  <a
                    href={`${basePath}/${node.folderPath}`}
                    className="block px-3 py-2 mb-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    {title}
                  </a>
                )}
                <RecursiveTree
                  basePath={basePath}
                  nodes={node.children}
                  imageConfig={imageConfig}
                  lang={lang}
                  depth={depth + 1}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function V2NavigationIsland({
  basePath,
  bookTitle,
  nodes,
  imageConfig,
  lang,
}: Props) {
  const singleRoot = nodes.length === 1
  const displayNodes = singleRoot ? nodes[0].children : nodes

  return (
    <div className="chapter-picker">
      <div className="flex items-center gap-3 mb-4">
        {basePath && (
          <a href="/" className="text-lg font-bold" style={{ color: "var(--text)" }}>
            &larr;
          </a>
        )}
        <h1 className="text-xl font-bold">{bookTitle}</h1>
      </div>

      {displayNodes.length > 0 && displayNodes.every((n) => n.children.length === 0) ? (
        <div className="chapter-grid">
          {displayNodes.map((node) => (
            <TreeNodeCard
              key={node.folderPath}
              basePath={basePath}
              node={node}
              imageConfig={imageConfig}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <RecursiveTree
          basePath={basePath}
          nodes={displayNodes}
          imageConfig={imageConfig}
          lang={lang}
          depth={0}
        />
      )}
    </div>
  )
}
