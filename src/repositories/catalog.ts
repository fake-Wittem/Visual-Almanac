import { styles, assets } from '../content'
import type { Style } from '../content/schema'
export interface CatalogRepository {
  list(): readonly Style[]
  get(id: string): Style | undefined
}
export const catalog: CatalogRepository = {
  list: () => styles,
  get: (id) => styles.find((s) => s.id === id),
}
export const assetById = (id: string) => assets.find((a) => a.id === id)!
export function imageUrl(id: string, size: 'thumb' | 'detail' | 'original' = 'thumb') {
  const file = size === 'original' ? assetById(id).file : `images/generated/${id}-${size}.webp`
  return `${import.meta.env.BASE_URL}${file}`
}
