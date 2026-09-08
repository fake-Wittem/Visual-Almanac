import { categories } from '../content/categories'
import { tags } from '../content/tags'
import { dimensions, type Dimension, type Style } from '../content/schema'
export type Filters = { q: string; category: string; sort: string; page: number } & Record<
  Dimension,
  string[]
>
export const emptyFilters = (favorites = false): Filters => ({
  q: '',
  category: '',
  mood: [],
  visual: [],
  color: [],
  usage: [],
  sort: favorites ? 'saved' : 'order',
  page: 1,
})
export function parseFilters(query: Record<string, unknown>, favorites = false): Filters {
  const f = emptyFilters(favorites)
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  f.q = str(query.q).trim()
  f.category = categories.some((c) => c.id === query.category) ? str(query.category) : ''
  f.sort = ['order', 'updated', 'name', ...(favorites ? ['saved'] : [])].includes(str(query.sort))
    ? str(query.sort)
    : f.sort
  const n = Number(query.page)
  f.page = Number.isSafeInteger(n) && n > 0 ? n : 1
  for (const d of dimensions) {
    const input = Array.isArray(query[d]) ? query[d] : [query[d]]
    f[d] = [
      ...new Set(
        input.filter(
          (v): v is string =>
            typeof v === 'string' && tags.some((t) => t.id === v && t.dimension === d),
        ),
      ),
    ].sort()
  }
  return f
}
export function serializeFilters(f: Filters) {
  const query: Record<string, string | string[]> = {}
  if (f.q) query.q = f.q
  if (f.category) query.category = f.category
  for (const d of dimensions) if (f[d].length) query[d] = [...f[d]].sort()
  query.sort = f.sort
  if (f.page > 1) query.page = String(f.page)
  return query
}
export function filterStyles(items: readonly Style[], f: Filters) {
  const terms = f.q.toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((s) => {
    const text = [
      s.name,
      s.englishName,
      ...s.aliases,
      s.summary,
      ...s.tags.map((id) => tags.find((t) => t.id === id)?.name || ''),
    ]
      .join(' ')
      .toLocaleLowerCase()
    return (
      (!f.category || s.category === f.category) &&
      terms.every((t) => text.includes(t)) &&
      dimensions.every((d) => !f[d].length || f[d].some((id) => s.tags.includes(id)))
    )
  })
}
export function sortStyles(
  items: readonly Style[],
  sort: string,
  saved: Record<string, number> = {},
) {
  return [...items].sort((a, b) => {
    let n = 0
    if (sort === 'updated') n = b.updatedAt.localeCompare(a.updatedAt)
    else if (sort === 'name') n = a.name.localeCompare(b.name, 'zh-CN')
    else if (sort === 'saved') n = (saved[b.id] || 0) - (saved[a.id] || 0)
    else n = a.order - b.order
    return n || a.id.localeCompare(b.id)
  })
}
export function pageStyles(items: readonly Style[], page: number, size = 24) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pages)
  return { items: items.slice((current - 1) * size, current * size), page: current, pages }
}
