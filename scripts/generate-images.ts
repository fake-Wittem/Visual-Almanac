import { mkdir, readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import type { Asset } from '../src/content/schema'
const assets: Asset[] = JSON.parse(await readFile('src/content/assets/manifest.json', 'utf8'))
await mkdir('public/images/generated', { recursive: true })
for (const a of assets)
  for (const [name, width] of [
    ['thumb', 560],
    ['detail', 1000],
  ] as const) {
    const src = `public/${a.file}`,
      out = `public/images/generated/${a.id}-${name}.webp`
    const current = await stat(out).catch(() => null)
    if (current && current.mtimeMs > (await stat(src)).mtimeMs) continue
    await sharp(src)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(out)
  }
console.log(`已准备 ${assets.length * 2} 张浏览图片。`)
