import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
const recipes = await Promise.all(
  (await readdir('templates/posters/batch-three'))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => readJson(`templates/posters/batch-three/${file}`)),
)
const manifest = await readJson('src/content/assets/manifest.json')
const counts = {}
const hashes = new Set()
const sheets = {}
assert.equal(recipes.length, 32, '第三批必须有32份配方')
for (const recipe of recipes) {
  const style = await readJson(`src/content/styles/${recipe.styleId}.json`)
  counts[style.category] = (counts[style.category] ?? 0) + 1
  const imagePath = `public/images/originals/${recipe.styleId}-poster.png`
  const bytes = await readFile(imagePath)
  hashes.add(createHash('sha256').update(bytes).digest('hex'))
  const meta = await sharp(bytes).metadata()
  assert.equal(meta.width, 1200)
  assert.equal(meta.height, 1500)
  const asset = manifest.find((entry) => entry.id === style.cover)
  assert.ok(asset, `${style.id}: 缺少资源登记`)
  assert.equal(asset.width, meta.width)
  assert.equal(asset.height, meta.height)
  assert.equal(asset.file, `images/originals/${recipe.styleId}-poster.png`)
  const svg = await readFile(`artifacts/poster-svg/${recipe.styleId}.svg`, 'utf8')
  const raw = await sharp(bytes).removeAlpha().raw().toBuffer()
  for (const [index, color] of recipe.colors.entries()) {
    assert.equal(style.palettes[0].colors[index].hex, color.hex)
    assert.equal(style.palettes[0].colors[index].name, color.name)
    const offset = (1154 * 1200 + 195 + index * 270) * 3
    assert.equal(
      '#' +
        raw
          .subarray(offset, offset + 3)
          .toString('hex')
          .toUpperCase(),
      color.hex,
    )
    for (const text of [color.hex, color.name, color.englishName]) assert.ok(svg.includes(text))
  }
  for (const text of [...recipe.sidebarCn, ...recipe.badges]) assert.ok(svg.includes(text))
  for (const [variant, width] of [
    ['thumb', 560],
    ['detail', 1000],
  ]) {
    const browserMeta = await sharp(
      `public/images/generated/${recipe.styleId}-poster-${variant}.webp`,
    ).metadata()
    assert.equal(browserMeta.width, width)
  }
  const group = (sheets[style.category] ??= [])
  group.push({
    input: await sharp(bytes).resize(360, 450).toBuffer(),
    left: group.length * 370,
    top: 0,
  })
}
assert.equal(Object.keys(counts).length, 8)
// 制作时为八类各4份；2026-09-15实验家居由年代怀旧转入先锋实验。
for (const [category, count] of Object.entries(counts))
  assert.equal(count, category === 'retro' ? 3 : category === 'avant-garde' ? 5 : 4)
assert.equal(hashes.size, 32, '不允许重复原图')
await mkdir('artifacts/batch-three', { recursive: true })
for (const [category, layers] of Object.entries(sheets)) {
  await sharp({
    create: { width: layers.length * 370, height: 450, channels: 3, background: '#FFFFFF' },
  })
    .composite(layers)
    .png()
    .toFile(`artifacts/batch-three/${category}.png`)
}
await writeFile(
  'artifacts/batch-three/verification.json',
  JSON.stringify(
    {
      styles: 32,
      categoryCounts: counts,
      uniqueOriginals: hashes.size,
      exactSwatches: 128,
      browserImages: 64,
      dimensions: '1200 × 1500',
    },
    null,
    2,
  ) + '\n',
)
console.log('第三批验证通过：32份档案（按调整后分类）、32张独立原图、128个精确色块、64张浏览图片。')
