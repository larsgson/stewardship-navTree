import { useState, useEffect, useRef } from "react"
import type { V2TreeNode } from "../lib/types"
import "./SidebarNav.css"

interface Props {
  title: string
  nodes: V2TreeNode[]
  basePath: string
  currentPath: string
  lang: string
}

function getNodeTitle(node: V2TreeNode, lang: string): string {
  return node.meta.locales?.[lang]?.title || node.meta.title
}

function findExpandedPath(nodes: V2TreeNode[], currentPath: string): string | null {
  for (const node of nodes) {
    const href = `/${node.folderPath}`
    if (currentPath === href || currentPath.startsWith(href + "/")) {
      return node.folderPath
    }
    const child = findExpandedPath(node.children, currentPath)
    if (child) return node.folderPath
  }
  return null
}

function SidebarSection({
  node,
  basePath,
  currentPath,
  lang,
  depth,
}: {
  node: V2TreeNode
  basePath: string
  currentPath: string
  lang: string
  depth: number
}) {
  const title = getNodeTitle(node, lang)
  const href = `${basePath}/${node.folderPath}`
  const isActive = currentPath === href
  const isAncestor = currentPath.startsWith(href + "/")
  const hasChildren = node.children.length > 0

  return (
    <div>
      <a
        href={href}
        className={`nav-item section-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: `${20 + depth * 16}px` }}
      >
        <span className="sidebar-section-title">{title}</span>
      </a>
      {hasChildren && (isActive || isAncestor) && (
        <div className="sections-list">
          {node.children.map((child) => (
            <SidebarSection
              key={child.folderPath}
              node={child}
              basePath={basePath}
              currentPath={currentPath}
              lang={lang}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SidebarNav({ title, nodes, basePath, currentPath, lang }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const prevPathRef = useRef(currentPath)
  const justToggledRef = useRef(false)

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sidebar-state-changed", { detail: { isOpen } }),
    )
    if (isOpen) {
      document.body.classList.add("sidebar-open")
    } else {
      document.body.classList.remove("sidebar-open")
    }
  }, [isOpen])

  useEffect(() => {
    if (prevPathRef.current === currentPath) return
    prevPathRef.current = currentPath
    if (justToggledRef.current) {
      justToggledRef.current = false
      return
    }
    setIsOpen(false)
  }, [currentPath])

  useEffect(() => {
    const handleToggle = () => {
      justToggledRef.current = true
      setTimeout(() => { justToggledRef.current = false }, 1000)
      setIsOpen((prev) => !prev)
    }
    window.addEventListener("toggle-sidebar", handleToggle)
    return () => window.removeEventListener("toggle-sidebar", handleToggle)
  }, [])

  const [expandedRoot, setExpandedRoot] = useState<string | null>(() => {
    return findExpandedPath(nodes, currentPath)
  })

  useEffect(() => {
    const found = findExpandedPath(nodes, currentPath)
    if (found) setExpandedRoot(found)
  }, [currentPath, nodes])

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <a href={`${basePath}/`} className="sidebar-title">{title}</a>
          <button
            className="close-button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="chapters-list">
            {nodes.map((node) => {
              const nodeTitle = getNodeTitle(node, lang)
              const href = `${basePath}/${node.folderPath}`
              const isActive = currentPath === href
              const isAncestor = currentPath.startsWith(href + "/")
              const isExpanded = expandedRoot === node.folderPath
              const hasChildren = node.children.length > 0

              return (
                <div key={node.folderPath} className="chapter-group">
                  <div
                    className={`nav-item chapter-item ${isActive ? "active" : ""}`}
                    onClick={() => setExpandedRoot(isExpanded ? null : node.folderPath)}
                  >
                    <a
                      href={href}
                      className="sidebar-chapter-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sidebar-chapter-title">{nodeTitle}</span>
                    </a>
                    {hasChildren && (
                      <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
                        ▼
                      </span>
                    )}
                  </div>

                  {isExpanded && hasChildren && (
                    <div className="sections-list">
                      {node.children.map((child) => (
                        <SidebarSection
                          key={child.folderPath}
                          node={child}
                          basePath={basePath}
                          currentPath={currentPath}
                          lang={lang}
                          depth={0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}
