import fs from "node:fs"
import path from "node:path"

interface AppConfig {
  appName: string
  defaultLanguage: string
  branding: {
    subtitle: string
    metaDescription: string
  }
}

const CONFIG_PATH = path.join(process.cwd(), "app.config.json")

let cached: AppConfig | null = null

export function loadAppConfig(): AppConfig {
  if (cached) return cached

  const defaults: AppConfig = {
    appName: "NavTree Reader",
    defaultLanguage: "eng",
    branding: {
      subtitle: "A multimedia book reader",
      metaDescription: "NavTree Reader - A multimedia book reader",
    },
  }

  if (!fs.existsSync(CONFIG_PATH)) return defaults

  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
    cached = { ...defaults, ...raw, branding: { ...defaults.branding, ...raw.branding } }
    return cached!
  } catch {
    return defaults
  }
}
