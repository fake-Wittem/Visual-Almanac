import type { Style } from '../content/schema'
import { tags } from '../content/tags'
export function relatedStyles(style: Style, all: readonly Style[]) {
  const rest = all.filter((s) => s.id !== style.id)
  const shared = (s: Style) => s.tags.filter((t) => style.tags.includes(t))
  const explicit = style.related
    .map((id) => rest.find((s) => s.id === id))
    .filter((s): s is Style => !!s)
  const ranked = rest.sort(
    (a, b) =>
      shared(b).length - shared(a).length ||
      Number(b.category === style.category) - Number(a.category === style.category) ||
      a.order - b.order ||
      a.id.localeCompare(b.id),
  )
  return [...new Map([...explicit, ...ranked].map((s) => [s.id, s])).values()]
    .slice(0, 4)
    .map((s) => ({
      style: s,
      reason: shared(s).length
        ? `共同标签：${shared(s)
            .slice(0, 2)
            .map((id) => tags.find((t) => t.id === id)?.name)
            .join('、')}`
        : s.category === style.category
          ? '同属复古'
          : '更多风格参考',
    }))
}
