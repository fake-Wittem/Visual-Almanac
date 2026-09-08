import type { Asset, Style } from './schema'
import assetData from './assets/manifest.json'
const modules = import.meta.glob<{ default: Style }>('./styles/*.json', { eager: true })
export const styles = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
export const assets = assetData as Asset[]
