import { z } from 'zod'

export const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/)
export const dimensions = ['mood', 'visual', 'color', 'usage'] as const
export type Dimension = (typeof dimensions)[number]
export const dimensionNames: Record<Dimension, string> = {
  mood: '情绪氛围',
  visual: '视觉特征',
  color: '色彩倾向',
  usage: '应用场景',
}
export const swatchSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    hex: z
      .string()
      .regex(/^#[0-9A-F]{6}$/)
      .nullable(),
    status: z.enum(['verified', 'sampled', 'manual', 'pending']),
    role: z.string().optional(),
  })
  .refine((s) => s.status === 'pending' || !!s.hex, '可用颜色必须有 HEX')
export const paletteSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    description: z.string(),
    colors: z.array(swatchSchema).min(1),
  })
  .refine((p) => new Set(p.colors.map((c) => c.id)).size === p.colors.length, '颜色 ID 重复')
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v)
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v
  }, '无效日期')
const historyText = z.string().trim().min(1, '设计史内容不能为空')
export const designHistorySchema = z
  .object({
    overview: historyText,
    timeline: z
      .array(
        z.object({
          year: z.number().int(),
          period: historyText,
          title: historyText,
          body: historyText,
          sourceIds: z.array(idSchema).min(1, '每个历史阶段必须引用来源'),
        }),
      )
      .min(3, '设计史至少包含三个发展阶段'),
    interpretation: historyText,
    sources: z
      .array(
        z.object({
          id: idSchema,
          title: historyText,
          publisher: historyText,
          url: z
            .string()
            .url()
            .refine((url) => /^https:\/\//.test(url), '来源必须使用 HTTPS 链接'),
        }),
      )
      .min(2, '设计史至少提供两项参考资料'),
  })
  .superRefine((history, ctx) => {
    const ids = history.sources.map((source) => source.id)
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', path: ['sources'], message: '设计史来源 ID 重复' })
    history.timeline.forEach((entry, index) => {
      if (index && entry.year < history.timeline[index - 1]!.year)
        ctx.addIssue({
          code: 'custom',
          path: ['timeline', index, 'year'],
          message: '发展阶段必须按时间顺序排列',
        })
      for (const id of entry.sourceIds)
        if (!ids.includes(id))
          ctx.addIssue({
            code: 'custom',
            path: ['timeline', index, 'sourceIds'],
            message: `引用来源 ${id} 不存在`,
          })
    })
    for (const id of ids)
      if (!history.timeline.some((entry) => entry.sourceIds.includes(id)))
        ctx.addIssue({ code: 'custom', path: ['sources'], message: `来源 ${id} 未被历史阶段引用` })
  })
export const styleSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    englishName: z.string(),
    aliases: z.array(z.string()),
    summary: z.string().min(1),
    category: idSchema,
    tags: z.array(idSchema),
    cover: idSchema,
    images: z.array(z.object({ asset: idSchema, caption: z.string() })).min(1),
    palettes: z.array(paletteSchema),
    notes: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })),
    applications: z.array(z.string()),
    designHistory: designHistorySchema,
    related: z.array(idSchema),
    order: z.number().int().nonnegative(),
    updatedAt: dateSchema,
  })
  .strict()
  .refine((s) => s.images.some((i) => i.asset === s.cover), '封面必须属于图库')
  .refine((s) => new Set(s.palettes.map((p) => p.id)).size === s.palettes.length, '配色 ID 重复')
export const assetSchema = z.object({
  id: idSchema,
  file: z.string().regex(/^images\/originals\/[a-z0-9-]+\.(png|jpe?g|webp)$/),
  originalName: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  source: z.string(),
})
export type Style = z.infer<typeof styleSchema>
export type DesignHistory = z.infer<typeof designHistorySchema>
export type Palette = z.infer<typeof paletteSchema>
export type Swatch = z.infer<typeof swatchSchema>
export type Asset = z.infer<typeof assetSchema>
export type Tag = { id: string; name: string; dimension: Dimension; color?: string }
