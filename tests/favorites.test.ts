import { it, expect } from 'vitest'
import {
  createFavoriteRepository,
  decodeFavorites,
  FAVORITES_KEY,
} from '../src/repositories/favorites'
const memory = () => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, v: string) => {
      data.set(key, v)
    },
  }
}
it('收藏持久化并保留未知档案，可按原时间撤销', () => {
  const storage = memory(),
    repo = createFavoriteRepository(() => storage)
  repo.set('retired-style', 1)
  repo.set('new-style', 2)
  repo.set('new-style', null)
  expect(repo.read().items).toEqual({ 'retired-style': 1 })
  repo.set('new-style', 2)
  expect(createFavoriteRepository(() => storage).read().items).toEqual({
    'retired-style': 1,
    'new-style': 2,
  })
})
it('损坏或未来版本记录保留原值，降级为内存', () => {
  const storage = memory()
  storage.setItem(FAVORITES_KEY, '{"schemaVersion":99,"items":{}}')
  const repo = createFavoriteRepository(() => storage)
  expect(repo.read().persistent).toBe(false)
  repo.set('sample', 10)
  expect(repo.read().items.sample).toBe(10)
  expect(storage.getItem(FAVORITES_KEY)).toContain('99')
})
it('写入被禁用仍可使用当前会话收藏', () => {
  const repo = createFavoriteRepository(() => ({
    getItem: () => null,
    setItem: () => {
      throw Error('blocked')
    },
  }))
  expect(repo.set('sample', 10)).toEqual({ persistent: false, items: { sample: 10 } })
})
it('写入前读取最新记录，避免覆盖另一个标签页已有收藏', () => {
  const storage = memory(),
    a = createFavoriteRepository(() => storage),
    b = createFavoriteRepository(() => storage)
  a.set('one', 1)
  b.set('two', 2)
  expect(a.read().items).toEqual({ one: 1, two: 2 })
})
it('拒绝损坏的收藏时间', () => {
  expect(() => decodeFavorites('{"schemaVersion":1,"items":{"sample":"bad"}}')).toThrow()
})
