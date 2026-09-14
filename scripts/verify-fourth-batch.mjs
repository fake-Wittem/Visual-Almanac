import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const json = async (path) => JSON.parse(await readFile(path, 'utf8'))
const recipes = await Promise.all(
  (await readdir('templates/posters/batch-four'))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => json(`templates/posters/batch-four/${file}`)),
)
const assets = await json('src/content/assets/manifest.json')
const counts = {}
const hashes = new Set()
const scenes = new Set()
const tiles = []
assert.equal(recipes.length, 8, '第四批计划八份档案')
for (const [i, recipe] of recipes.entries()) {
  const style = await json(`src/content/styles/${recipe.styleId}.json`)
  counts[style.category] = (counts[style.category] ?? 0) + 1
  const asset = assets.find((entry) => entry.id === style.cover)
  assert.ok(asset, `${style.id}: 缺少资源登记`)
  assert.equal(asset.file, `images/originals/${style.id}-poster.png`)
  const bytes = await readFile(`public/${asset.file}`)
  hashes.add(createHash('sha256').update(bytes).digest('hex'))
  scenes.add(
    createHash('sha256')
      .update(await readFile(recipe.sceneFile))
      .digest('hex'),
  )
  const meta = await sharp(bytes).metadata()
  assert.equal(meta.width, 1200)
  assert.equal(meta.height, 1500)
  assert.equal(asset.width, meta.width)
  assert.equal(asset.height, meta.height)
  const svg = await readFile(`artifacts/poster-svg/${style.id}.svg`, 'utf8')
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
      `public/images/generated/${style.id}-poster-${variant}.webp`,
    ).metadata()
    assert.equal(browserMeta.width, width)
  }
  tiles.push({
    input: await sharp(bytes).resize(360, 450).toBuffer(),
    left: (i % 4) * 370,
    top: Math.floor(i / 4) * 460,
  })
}
assert.equal(Object.keys(counts).length, 8)
for (const count of Object.values(counts)) {
  assert.ok(count <= 4, '每个大类本批最多扩充四份')
  assert.equal(count, 1, '第四批选择八类各一份')
}
assert.equal(hashes.size, 8, '原图不得重复')
assert.equal(scenes.size, 8, '场景不得重复')
await mkdir('artifacts/batch-four', { recursive: true })
await sharp({ create: { width: 1470, height: 910, channels: 3, background: '#FFFFFF' } })
  .composite(tiles)
  .png()
  .toFile('artifacts/batch-four/contact-sheet.png')
await writeFile(
  'artifacts/batch-four/verification.json',
  JSON.stringify(
    {
      styles: recipes.length,
      categoryCounts: counts,
      uniqueOriginals: hashes.size,
      uniqueScenes: scenes.size,
      exactSwatches: 32,
      browserImages: 16,
      dimensions: '1200 × 1500',
    },
    null,
    2,
  ) + '\n',
)
console.log('第四批验证通过：八类各1份、8张独立场景与原图、32个精确色块、16张浏览图片。')
