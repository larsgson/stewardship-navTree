import fs from "node:fs"
import path from "node:path"
import { parse as parseToml } from "smol-toml"
import type {
  V2Config,
  V2NodeMeta,
  V2TreeNode,
  V2BookData,
  ContentBlock,
  ImageConfig,
  ParsedMarkdown,
  Section,
} from "./types"
import { resolveBookDir } from "./book-loader"

export function isV2Book(bookId: string): boolean {
  return fs.existsSync(path.join(resolveBookDir(bookId), "config.toml"))
}

export function loadV2Config(bookId: string): V2Config | null {
  const configPath = path.join(resolveBookDir(bookId), "config.toml")
  if (!fs.existsSync(configPath)) return null

  try {
    const raw = parseToml(fs.readFileSync(configPath, "utf-8")) as any
    return {
      formatVersion: raw.format_version || "2.0",
      projectName: raw.project_name || bookId,
      defaultLanguage: raw.default_language || "eng",
      languages: raw.languages || ["eng"],
      pictures: raw.pictures || undefined,
      audio: raw.audio || undefined,
    }
  } catch {
    return null
  }
}

function loadNodeMeta(folderPath: string): V2NodeMeta | null {
  const tomlPath = path.join(folderPath, "index.toml")
  if (!fs.existsSync(tomlPath)) return null

  try {
    const raw = parseToml(fs.readFileSync(tomlPath, "utf-8")) as any
    const locales: Record<string, { title?: string; description?: string }> = {}
    if (raw.locales) {
      for (const [lang, data] of Object.entries(raw.locales as Record<string, any>)) {
        locales[lang] = { title: data.title, description: data.description }
      }
    }

    return {
      contentId: raw.content_id || "",
      title: raw.title || "",
      sectionId: raw.section_id,
      description: raw.description,
      thumbnail: raw.thumbnail,
      redirectTo: raw.redirect_to,
      locales: Object.keys(locales).length > 0 ? locales : undefined,
      pictures: Array.isArray(raw.pictures) ? raw.pictures : undefined,
      audio: Array.isArray(raw.audio) ? raw.audio : undefined,
    }
  } catch {
    return null
  }
}

function scanTree(baseDir: string, relativePath: string = ""): V2TreeNode[] {
  const dir = relativePath ? path.join(baseDir, relativePath) : baseDir
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir).filter((name) => {
    const full = path.join(dir, name)
    return fs.statSync(full).isDirectory() && /^\d+$/.test(name)
  }).sort()

  return entries.map((name) => {
    const folderPath = relativePath ? `${relativePath}/${name}` : name
    const fullDir = path.join(baseDir, folderPath)
    const meta = loadNodeMeta(fullDir)
    if (!meta) return null

    const hasContent =
      fs.existsSync(path.join(fullDir, "content.json")) ||
      fs.existsSync(path.join(fullDir, "content.md"))

    return {
      folderPath,
      meta,
      hasContent,
      children: scanTree(baseDir, folderPath),
    }
  }).filter(Boolean) as V2TreeNode[]
}

export function loadV2BookData(bookId: string): V2BookData | null {
  const config = loadV2Config(bookId)
  if (!config) return null

  const bookDir = path.join(resolveBookDir(bookId))
  const roots = scanTree(bookDir)

  let imageConfig: ImageConfig | null = null
  if (config.pictures?.base_url) {
    imageConfig = { base_url: config.pictures.base_url }
  }

  return { id: bookId, config, roots, imageConfig }
}

export function loadV2Content(bookId: string, folderPath: string): ContentBlock[] | null {
  const bookDir = path.join(resolveBookDir(bookId))
  const nodeDir = path.join(bookDir, folderPath)

  const jsonPath = path.join(nodeDir, "content.json")
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
      return raw.content || []
    } catch {
      return null
    }
  }

  return null
}

export function loadV2Markdown(bookId: string, folderPath: string): string | null {
  const mdPath = path.join(resolveBookDir(bookId), folderPath, "content.md")
  if (!fs.existsSync(mdPath)) return null
  return fs.readFileSync(mdPath, "utf-8")
}

export function buildWikiLinkMap(
  roots: V2TreeNode[],
  basePath: string,
): Record<string, string> {
  const map: Record<string, string> = {}
  function walk(node: V2TreeNode) {
    const slug = node.meta.contentId
    if (slug && !node.meta.redirectTo) {
      map[slug] = `${basePath}/${node.folderPath}`
    }
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  for (const node of flattenNodes(roots)) {
    const slug = node.meta.contentId
    if (slug && !(slug in map)) {
      map[slug] = `${basePath}/${node.folderPath}`
    }
  }
  return map
}

function flattenNodes(roots: V2TreeNode[]): V2TreeNode[] {
  const result: V2TreeNode[] = []
  function walk(node: V2TreeNode) {
    result.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return result
}

export function resolveWikiLinks(
  md: string,
  linkMap: Record<string, string>,
): string {
  return md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_match, target: string, label?: string) => {
    const slug = target.includes("/") ? target.split("/").pop()! : target
    const url = linkMap[slug]
    const displayText = label || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    if (url) {
      return `[${displayText}](${url})`
    }
    return displayText
  })
}

export function stripFrontmatter(md: string): string {
  if (!md.startsWith("---")) return md
  const end = md.indexOf("\n---", 3)
  if (end === -1) return md
  return md.slice(end + 4).trimStart()
}

export function resolveV2NodeTitle(
  node: V2TreeNode,
  lang: string,
): string {
  if (node.meta.locales?.[lang]?.title) {
    return node.meta.locales[lang].title!
  }
  return node.meta.title
}

export function buildNavOrder(roots: V2TreeNode[]): V2TreeNode[] {
  const order: V2TreeNode[] = []
  function walk(node: V2TreeNode) {
    order.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return order
}

export function contentBlocksToSections(
  blocks: ContentBlock[],
  title: string = "",
): ParsedMarkdown {
  const sections: Section[] = []
  let current: Section = { imageUrls: [], text: "", paragraphIndices: [] }
  let paragraphCounter = 0

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        if (current.text.trim() || current.imageUrls.length > 0 || current.heading) {
          sections.push(current)
        }
        current = { imageUrls: [], text: "", heading: block.text, paragraphIndices: [] }
        break

      case "image":
        if (!current.text.trim() && !current.heading) {
          current.imageUrls.push(block.path || "")
        } else {
          if (current.text.trim() || current.imageUrls.length > 0 || current.heading) {
            sections.push(current)
          }
          current = { imageUrls: [block.path || ""], text: "", paragraphIndices: [] }
        }
        break

      case "paragraph":
        current.text += (current.text ? "\n" : "") + (block.text || "")
        current.paragraphIndices.push(paragraphCounter++)
        break

      case "table":
        if (block.rows) {
          for (const row of block.rows) {
            const cellTexts = row.cells.map((c) => c.text).join("\t")
            current.text += (current.text ? "\n" : "") + cellTexts
            current.paragraphIndices.push(paragraphCounter++)
          }
        }
        break
    }
  }

  if (current.text.trim() || current.imageUrls.length > 0 || current.heading) {
    sections.push(current)
  }

  return { title, sections }
}

export function findV2Node(roots: V2TreeNode[], folderPath: string): V2TreeNode | null {
  for (const root of roots) {
    if (root.folderPath === folderPath) return root
    const found = findV2Node(root.children, folderPath)
    if (found) return found
  }
  return null
}

export function resolveV2Redirect(
  bookId: string,
  node: V2TreeNode,
  roots: V2TreeNode[],
): V2TreeNode {
  if (!node.meta.redirectTo) return node
  const target = findV2Node(roots, node.meta.redirectTo)
  return target || node
}
