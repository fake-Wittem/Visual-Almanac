import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { designHistorySchema, styleSchema } from '../src/content/schema'

const directory = new URL('../src/content/styles/', import.meta.url)
const archives = readdirSync(directory)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    file,
    content: JSON.parse(readFileSync(new URL(file, directory), 'utf8')),
  }))
const example = () => structuredClone(archives[0]!.content.designHistory)

describe('设计史内容契约', () => {
  it.each(archives)('$file 的完整档案通过校验', ({ content }) => {
    expect(styleSchema.safeParse(content).success).toBe(true)
  })

  it('新增档案必须提供设计史，并拒绝旧实践记录字段', () => {
    const content = structuredClone(archives[0]!.content)
    delete content.designHistory
    expect(styleSchema.safeParse(content).success).toBe(false)
    expect(styleSchema.safeParse({ ...archives[0]!.content, practice: [] }).success).toBe(false)
  })

  it('缺少阶段、来源或正文时不能发布', () => {
    for (const change of [
      (h: ReturnType<typeof example>) => {
        h.timeline = h.timeline.slice(0, 2)
      },
      (h: ReturnType<typeof example>) => {
        h.sources = h.sources.slice(0, 1)
      },
      (h: ReturnType<typeof example>) => {
        h.overview = '  '
      },
      (h: ReturnType<typeof example>) => {
        h.timeline[0].sourceIds = []
      },
    ]) {
      const history = example()
      change(history)
      expect(designHistorySchema.safeParse(history).success).toBe(false)
    }
  })

  it('拒绝乱序时间线、失效引用、重复和未引用来源及非 HTTPS 链接', () => {
    for (const change of [
      (h: ReturnType<typeof example>) => {
        h.timeline[0].year = h.timeline[1].year + 1
      },
      (h: ReturnType<typeof example>) => {
        h.timeline[0].sourceIds = ['missing-source']
      },
      (h: ReturnType<typeof example>) => {
        h.sources.push({ ...h.sources[0] })
      },
      (h: ReturnType<typeof example>) => {
        h.sources.push({ ...h.sources[0], id: 'unused-source' })
      },
      (h: ReturnType<typeof example>) => {
        h.sources[0].url = 'javascript:alert(1)'
      },
    ]) {
      const history = example()
      change(history)
      expect(designHistorySchema.safeParse(history).success).toBe(false)
    }
  })
})
