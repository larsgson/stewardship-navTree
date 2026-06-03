export interface ImageConfig {
  base_url: string
}

export interface TemplateStory {
  id: string
  image: string
}

export interface TemplateCategory {
  id: string
  image: string
  audioUrl: string
  audioHqUrl: string
  stories: TemplateStory[]
}

export interface BookStructure {
  id: string
  coverImage: string
  imageConfig: ImageConfig | null
  categories: TemplateCategory[]
}

export interface CategoryMeta {
  title: string
  description: string
}

export interface StoryMeta {
  title: string
  description: string
}

export interface LocaleData {
  bookTitle: string
  topLevel: Record<string, string>
  categories: Record<string, CategoryMeta>
  categoryExtras: Record<string, Record<string, string>>
  stories: Record<string, StoryMeta>
  sections: Record<string, Record<string, string>>
}

export interface PageTiming {
  segments: number[]
  words: number[][]
}

export interface PageBlock {
  type: "image" | "text" | "heading" | "description"
  content: string
  paragraphIndex?: number
}

export interface ParsedPage {
  title: string
  description: string
  blocks: PageBlock[]
}

export interface Section {
  imageUrls: string[]
  text: string
  heading?: string
  description?: string
  paragraphIndices: number[]
}

export interface ParsedMarkdown {
  title: string
  sections: Section[]
}

// V2 format types

export interface ContentBlock {
  type: "paragraph" | "heading" | "image" | "table"
  text?: string
  path?: string
  alt?: string
  caption?: string
  rows?: { cells: { text: string }[] }[]
}

export interface V2Config {
  formatVersion: string
  projectName: string
  defaultLanguage: string
  languages: string[]
  pictures?: { base_url?: string; local_dir?: string; path_pattern?: string }
  audio?: { base_url?: string; local_dir?: string }
}

export interface V2NodeMeta {
  contentId: string
  title: string
  sectionId?: string
  description?: string
  thumbnail?: string
  redirectTo?: string
  locales?: Record<string, { title?: string; description?: string }>
  pictures?: { filename: string; caption?: string; alt?: string }[]
  audio?: { filename: string; language?: string; duration_seconds?: number; timing_file?: string }[]
}

export interface V2TreeNode {
  folderPath: string
  meta: V2NodeMeta
  hasContent: boolean
  children: V2TreeNode[]
}

export interface V2BookData {
  id: string
  config: V2Config
  roots: V2TreeNode[]
  imageConfig: ImageConfig | null
}
