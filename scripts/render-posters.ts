import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { z } from 'zod'
import { styleSchema } from '../src/content/schema'

const text = z.string().trim().min(1)
const recipeSchema = z
  .object({
    styleId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    title: text.max(12),
    accentLength: z.number().int().positive(),
    // 浅色主题可单独指定标题墨色，四色色卡仍以档案配色为准。
    titleColors: z
      .tuple([z.string().regex(/^#[0-9A-F]{6}$/), z.string().regex(/^#[0-9A-F]{6}$/)])
      .optional(),
    colors: z
      .array(z.object({ name: text, hex: z.string().regex(/^#[0-9A-F]{6}$/), englishName: text }))
      .length(4),
    sidebarCn: z.array(text.max(12)).length(4),
    sidebarEn: z.array(text.max(28)).length(2),
    badges: z.array(text.min(2).max(4)).length(3),
    sceneFile: z.string().regex(/^assets\/poster-scenes\/[a-z0-9-]+\.png$/),
    scenePrompt: text,
  })
  .refine((r) => r.accentLength < Array.from(r.title).length, '标题分色必须保留两个片段')

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  )
const hexRgb = (hex: string) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
const luminance = (hex: string) =>
  hexRgb(hex).reduce((sum, value, i) => {
    const v = value / 255
    return (
      sum + (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i]!
    )
  }, 0)
const input = resolve(process.argv[2] ?? 'templates/posters/batch-one')
const output = resolve(process.argv[3] ?? 'public/images/originals')
await mkdir(output, { recursive: true })
const svgOutput = resolve('artifacts/poster-svg')
await mkdir(svgOutput, { recursive: true })

for (const file of (await readdir(input)).filter((name) => name.endsWith('.json')).sort()) {
  const recipe = recipeSchema.parse(JSON.parse(await readFile(resolve(input, file), 'utf8')))
  const style = styleSchema.parse(
    JSON.parse(await readFile(`src/content/styles/${recipe.styleId}.json`, 'utf8')),
  )
  const colors = style.palettes[0]?.colors
  if (
    !colors ||
    colors.length !== 4 ||
    recipe.colors.some((color, i) => color.hex !== colors[i]!.hex || color.name !== colors[i]!.name)
  )
    throw new Error(`${recipe.styleId}: 海报色卡与档案配色不一致`)
  // 场景作为独立图像嵌入；文字、色卡和网格由 SVG 原生排版。
  const scene = (await readFile(recipe.sceneFile)).toString('base64')
  const primary =
    recipe.titleColors?.[0] ??
    [...recipe.colors].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]!.hex
  const accent =
    recipe.titleColors?.[1] ??
    recipe.colors.find((color) => color.hex !== primary && luminance(color.hex) < 0.28)?.hex ??
    primary
  const titleParts = Array.from(recipe.title)
  const size = Math.min(132, 872 / titleParts.length)
  const first = titleParts.slice(0, -recipe.accentLength).join('')
  const last = titleParts.slice(-recipe.accentLength).join('')
  const label = (x: number, y: number, content: string, fontSize = 22, extra = '') =>
    `<text x="${x}" y="${y}" font-size="${fontSize}" ${extra}>${escape(content)}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.035"/></feComponentTransfer></filter></defs>
  <rect width="1200" height="1500" fill="#F1E9DA"/>
  <rect width="1200" height="1500" filter="url(#paper)"/>
  <rect x="36" y="41" width="1128" height="1435" fill="none" stroke="#9B8B73"/>
  <g fill="#302C25" font-family="SimSun, Noto Serif CJK SC, serif">
  ${label(70, 30, 'A PALETTE FOR A BETTER LIFE', 14, 'letter-spacing="5"')}
  ${label(1140, 30, '色彩，让生活更有故事', 14, 'text-anchor="end" letter-spacing="2"')}
  <text x="66" y="215" font-size="${size}" font-weight="bold"><tspan fill="${primary}">${escape(first)}</tspan><tspan fill="${accent}">${escape(last)}</tspan></text>
  ${label(505, 282, '配色关键词：' + recipe.colors.map((c) => c.name).join(' / '), 27, 'text-anchor="middle"')}
  <path d="M966 88 V287" stroke="#9B8B73" stroke-width="1"/>
  ${recipe.sidebarCn.map((s, i) => label(982, 110 + i * 27, s, 16)).join('')}
  ${recipe.sidebarEn.map((s, i) => label(982, 243 + i * 28, s, 19, 'font-family="Georgia, serif" font-style="italic"')).join('')}
  <image x="49" y="315" width="1102" height="755" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/png;base64,${scene}"/>
  ${recipe.colors
    .map((c, i) => {
      const x = 70 + i * 270
      return `<rect x="${x}" y="1083" width="251" height="142" fill="${c.hex}"/>${label(x, 1260, c.name, 25)}${label(x, 1290, c.hex, 20, 'font-family="Georgia, serif" letter-spacing="1"')}${label(x, 1315, c.englishName, 16, 'font-family="Georgia, serif"')}`
    })
    .join('')}
  <path d="M70 1375 H320 M880 1375 H1130" fill="none" stroke="#9B8B73"/>
  ${recipe.badges
    .map((badge, i) => {
      const x = 352 + i * 179
      return `<path d="M${x + 12} 1335 H${x + 128} Q${x + 128} 1347 ${x + 140} 1347 V1387 Q${x + 128} 1387 ${x + 128} 1399 H${x + 12} Q${x + 12} 1387 ${x} 1387 V1347 Q${x + 12} 1347 ${x + 12} 1335 Z" fill="none" stroke="#9B8B73" stroke-width="2"/><rect x="${x + 7}" y="1342" width="126" height="50" rx="8" fill="none" stroke="#9B8B73"/>${label(x + 70, 1379, badge, 27, 'text-anchor="middle"')}`
    })
    .join('')}
  ${label(600, 1435, '经典的颜色，装下更丰盛的生活。', 15, 'text-anchor="middle" letter-spacing="3"')}
  ${label(600, 1458, 'CLASSIC COLORS FOR A RICHER LIFE.', 11, 'text-anchor="middle" letter-spacing="2"')}
  ${['COLOURS', 'IDEAS', 'A KINDER YOU'].map((s, i) => label(70, 1426 + i * 16, s, 10, 'letter-spacing="2"')).join('')}
  ${['SOME', 'BEAUTY', 'LASTS LONGER.'].map((s, i) => label(1130, 1426 + i * 16, s, 10, 'text-anchor="end" letter-spacing="2"')).join('')}
  </g></svg>`
  await writeFile(resolve(svgOutput, `${recipe.styleId}.svg`), svg)
  // 仅重新绘制指定配方目录中的海报，其他分类不受影响。
  await sharp(Buffer.from(svg))
    .png()
    .toFile(resolve(output, `${recipe.styleId}-poster.png`))
  console.log(`已排版 ${recipe.styleId}：1200 × 1500`)
}
