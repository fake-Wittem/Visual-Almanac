export type SavedItems = Record<string, number>
export interface FavoriteSnapshot {
  items: SavedItems
  persistent: boolean
}
export interface FavoriteRepository {
  read(): FavoriteSnapshot
  set(id: string, time: number | null): FavoriteSnapshot
  subscribe(listener: (value: FavoriteSnapshot) => void): () => void
}
export const FAVORITES_KEY = 'visual-almanac:favorites:v1'
export function decodeFavorites(raw: string | null): SavedItems {
  if (!raw) return {}
  const data = JSON.parse(raw)
  if (
    data?.schemaVersion !== 1 ||
    !data.items ||
    typeof data.items !== 'object' ||
    Array.isArray(data.items)
  )
    throw Error('收藏格式不可识别')
  const result: SavedItems = {}
  for (const [id, time] of Object.entries(data.items)) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      typeof time !== 'number' ||
      !Number.isFinite(time) ||
      time < 0
    )
      throw Error('收藏记录无效')
    result[id] = time
  }
  return result
}
// 存储损坏或被禁用时保留原记录，仅使用内存状态。
export function createFavoriteRepository(
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'>,
): FavoriteRepository {
  let memory: SavedItems = {},
    persistent = true
  const listeners = new Set<(value: FavoriteSnapshot) => void>()
  const snapshot = (): FavoriteSnapshot => ({ items: { ...memory }, persistent })
  const read = () => {
    if (persistent)
      try {
        memory = decodeFavorites(getStorage().getItem(FAVORITES_KEY))
      } catch {
        persistent = false
      }
    return snapshot()
  }
  if (typeof window !== 'undefined')
    window.addEventListener('storage', (e) => {
      if (e.key !== null && e.key !== FAVORITES_KEY) return
      const value = read()
      listeners.forEach((fn) => fn(value))
    })
  return {
    read,
    set(id, time) {
      read()
      if (time === null) delete memory[id]
      else memory[id] = time
      if (persistent)
        try {
          getStorage().setItem(FAVORITES_KEY, JSON.stringify({ schemaVersion: 1, items: memory }))
        } catch {
          persistent = false
        }
      const value = snapshot()
      listeners.forEach((fn) => fn(value))
      return value
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}
