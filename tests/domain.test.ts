import { describe, it, expect } from 'vitest'
import {
  emptyFilters,
  filterStyles,
  parseFilters,
  sortStyles,
  pageStyles,
  serializeFilters,
} from '../src/domain/catalog'
import { paletteCss, paletteText } from '../src/domain/palette'
import { relatedStyles } from '../src/domain/related'
import { styleSchema } from '../src/content/schema'
import british from '../src/content/styles/british-academia.json'
import french from '../src/content/styles/french-salon.json'
import hongkong from '../src/content/styles/hong-kong-cinema.json'
const all = [british, french, hongkong].map((s) => styleSchema.parse(s))
describe('档案查询', () => {
  it('同维度并集、不同维度交集，多个搜索词分别命中', () => {
    const f = { ...emptyFilters(), mood: ['calm', 'mysterious'], visual: ['neon'] }
    expect(filterStyles(all, f).map((s) => s.id)).toEqual(['hong-kong-cinema'])
    expect(filterStyles(all, { ...emptyFilters(), q: 'British 木质' }).map((s) => s.id)).toEqual([
      'british-academia',
    ])
  })
  it('忽略无效 URL 参数并可稳定往返', () => {
    const f = parseFilters({
      category: 'missing',
      mood: ['calm', 'calm', 'wood'],
      page: '-2',
      sort: 'saved',
    })
    expect(f.category).toBe('')
    expect(f.mood).toEqual(['calm'])
    expect(f.page).toBe(1)
    expect(f.sort).toBe('order')
    expect(parseFilters(serializeFilters(f))).toEqual(f)
  })
  it('收藏按时间排序，数量变化后纠正页码', () => {
    expect(sortStyles(all, 'saved', { 'french-salon': 20, 'british-academia': 10 })[0]!.id).toBe(
      'french-salon',
    )
    expect(pageStyles(all, 99, 2)).toMatchObject({ page: 2, pages: 2, items: [all[2]] })
  })
})
describe('配色和关联', () => {
  it('待核对颜色不进入整组与 CSS 输出', () => {
    const p = {
      ...all[0]!.palettes[0]!,
      colors: [
        { id: 'one', name: '已知', hex: '#123456', status: 'manual' as const },
        { id: 'two', name: '未知', hex: '#FFFFFF', status: 'pending' as const },
      ],
    }
    expect(paletteText(p)).toBe('#123456')
    expect(paletteCss('sample', p)).toContain('--sample-poster-one: #123456;')
    expect(paletteCss('sample', p)).not.toContain('FFFFFF')
  })
  it('优先显式关联，去重并排除自身', () => {
    const s = { ...all[0]!, related: ['hong-kong-cinema', 'hong-kong-cinema'] }
    expect(relatedStyles(s, all).map((x) => x.style.id)).toEqual([
      'hong-kong-cinema',
      'french-salon',
    ])
  })
  it('内容模型拒绝非法日期、缺失可用色值和重复配色', () => {
    expect(styleSchema.safeParse({ ...british, updatedAt: '2026-02-31' }).success).toBe(false)
    expect(
      styleSchema.safeParse({ ...british, palettes: [british.palettes[0], british.palettes[0]] })
        .success,
    ).toBe(false)
    const p = structuredClone(british)
    p.palettes[0]!.colors[0]!.hex = 'wrong'
    expect(styleSchema.safeParse(p).success).toBe(false)
  })
})
