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
    practice: z.array(z.string()),
    related: z.array(idSchema),
    order: z.number().int().nonnegative(),
    updatedAt: dateSchema,
  })
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
export type Palette = z.infer<typeof paletteSchema>
export type Swatch = z.infer<typeof swatchSchema>
export type Asset = z.infer<typeof assetSchema>
export type Tag = { id: string; name: string; dimension: Dimension; color?: string }
