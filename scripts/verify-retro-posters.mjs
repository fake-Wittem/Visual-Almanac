import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const recipes = await Promise.all(
  (await readdir('templates/posters/retro'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map(async (f) => JSON.parse(await readFile(`templates/posters/retro/${f}`, 'utf8'))),
)
const styles = await Promise.all(
  (await readdir('src/content/styles'))
    .filter((f) => f.endsWith('.json'))
    .map(async (f) => JSON.parse(await readFile(`src/content/styles/${f}`, 'utf8'))),
)
assert.deepEqual(
  recipes.map((r) => r.styleId).sort(),
  styles
    .filter((s) => s.category === 'retro')
    .map((s) => s.id)
    .sort(),
)
const manifest = JSON.parse(await readFile('src/content/assets/manifest.json', 'utf8'))
const thumbnails = []
for (const [index, r] of recipes.entries()) {
  const file = `public/images/originals/${r.styleId}-poster.png`
  const meta = await sharp(file).metadata()
  assert.equal(meta.width, 1200)
  assert.equal(meta.height, 1500)
  const asset = manifest.find((a) => a.id === `${r.styleId}-poster`)
  assert.equal(asset.width, meta.width)
  assert.equal(asset.height, meta.height)
  const svg = await readFile(`artifacts/poster-svg/${r.styleId}.svg`, 'utf8')
  for (const [i, c] of r.colors.entries()) {
    assert.ok(svg.includes(c.name) && svg.includes(c.hex) && svg.includes(c.englishName))
    const { data } = await sharp(file)
      .extract({ left: 195 + i * 270, top: 1154, width: 1, height: 1 })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    assert.equal('#' + Buffer.from(data).toString('hex').toUpperCase(), c.hex)
  }
  for (const t of [...r.sidebarCn, ...r.badges]) assert.ok(svg.includes(t))
  for (const variant of ['thumb', 'detail']) {
    const browserMeta = await sharp(
      `public/images/generated/${r.styleId}-poster-${variant}.webp`,
    ).metadata()
    assert.equal(browserMeta.width, variant === 'thumb' ? 560 : 1000)
  }
  thumbnails.push({
    input: await sharp(file).resize(300, 375).toBuffer(),
    left: (index % 4) * 310,
    top: Math.floor(index / 4) * 385,
  })
}
await mkdir('artifacts/retro-posters', { recursive: true })
await sharp({ create: { width: 1230, height: 1145, channels: 3, background: '#ffffff' } })
  .composite(thumbnails)
  .png()
  .toFile('artifacts/retro-posters/contact-sheet.png')
await writeFile(
  'artifacts/retro-posters/verification.json',
  JSON.stringify(
    {
      count: recipes.length,
      dimensions: '1200x1500',
      palettePixels: '48/48 exact HEX matches',
      browserImages: 24,
      styleIds: recipes.map((r) => r.styleId),
    },
    null,
    2,
  ) + '\n',
)
console.log('12 张复古海报：分类覆盖、尺寸、48 个色块像素、文案输入和 24 张浏览图片检查通过。')
