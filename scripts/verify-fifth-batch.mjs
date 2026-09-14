import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const json = async (path) => JSON.parse(await readFile(path, 'utf8'))
const recipes = await Promise.all(
  (await readdir('templates/posters/batch-five'))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => json(`templates/posters/batch-five/${file}`)),
)
const assets = await json('src/content/assets/manifest.json')
const expected = {
  'shanghai-calendar-posters': 'retro',
  'republican-print': 'retro',
  'taisho-romance': 'retro',
  'italian-rationalism': 'modern-minimal',
  'warm-minimal': 'modern-minimal',
  'editorial-typography': 'modern-minimal',
  'monochrome-minimal': 'modern-minimal',
  'modular-information': 'modern-minimal',
  'biomorphic-design': 'natural-organic',
  'biomimetic-design': 'natural-organic',
  cottagecore: 'natural-organic',
  'rustic-contemporary': 'natural-organic',
  'rammed-earth': 'natural-organic',
  'ming-furniture': 'eastern-aesthetics',
  'blue-green-landscape': 'eastern-aesthetics',
  'dunhuang-murals': 'eastern-aesthetics',
  'papercut-new-year': 'eastern-aesthetics',
  'japanese-tea-room': 'eastern-aesthetics',
  karesansui: 'eastern-aesthetics',
  'korean-minhwa': 'eastern-aesthetics',
  'greco-roman': 'classical-decorative',
  renaissance: 'classical-decorative',
  'empire-style': 'classical-decorative',
  'islamic-ornament': 'classical-decorative',
  'iberian-maghrebi-tiles': 'classical-decorative',
  'frutiger-aero': 'future-tech',
  dieselpunk: 'future-tech',
  'atomic-age': 'future-tech',
  synthwave: 'future-tech',
  'biotech-future': 'future-tech',
  'italian-radical': 'avant-garde',
  'deconstructed-typography': 'avant-garde',
  'psychedelic-visual': 'avant-garde',
  'neo-expressionism': 'avant-garde',
  'glitch-art': 'avant-garde',
  'grunge-visual': 'street-pop',
  'surf-culture': 'street-pop',
  'street-comic': 'street-pop',
  'harajuku-mix': 'street-pop',
  'sports-supporter': 'street-pop',
}
const counts = {}
const categoryTiles = {}
const hashes = new Set()
const scenes = new Set()
const tiles = []
assert.deepEqual(
  recipes.map((r) => r.styleId).sort(),
  Object.keys(expected).sort(),
  '第五批必须覆盖全部40个候选',
)
for (const [i, recipe] of recipes.entries()) {
  const style = await json(`src/content/styles/${recipe.styleId}.json`)
  assert.equal(style.category, expected[style.id])
  assert.equal(
    style.order,
    81 + Object.keys(expected).indexOf(style.id),
    `${style.id}: 本批排序不一致`,
  )
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
  const group = (categoryTiles[style.category] ??= [])
  group.push({
    input: await sharp(bytes).resize(360, 450).toBuffer(),
    left: (group.length % 4) * 370,
    top: Math.floor(group.length / 4) * 460,
  })
  tiles.push({
    input: await sharp(bytes).resize(360, 450).toBuffer(),
    left: (i % 4) * 370,
    top: Math.floor(i / 4) * 460,
  })
}
assert.equal(Object.keys(counts).length, 8)
for (const category of Object.values(expected))
  assert.equal(
    counts[category],
    Object.values(expected).filter((value) => value === category).length,
  )
assert.equal(hashes.size, 40, '原图不得重复')
assert.equal(scenes.size, 40, '场景不得重复')
const allStyles = await Promise.all(
  (await readdir('src/content/styles'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => json('src/content/styles/' + file)),
)
assert.equal(allStyles.length, 120)
assert.equal(assets.length, 120)
assert.equal(new Set(allStyles.map((style) => style.order)).size, 120)
const catalog = await readFile('docs/风格分类与扩充清单.md', 'utf8')
const catalogRows = catalog.split('\n').filter((line) => /^\| [A-Z]\d{2}/.test(line))
assert.equal(catalogRows.length, 120)
assert.ok(
  catalogRows.every((line) => line.includes('已收录')),
  '清单仍有未收录条目',
)
for (const style of allStyles)
  assert.ok(
    catalogRows.some((line) => line.includes('/' + style.id + '.json)')),
    style.id + ': 缺少清单链接',
  )
await mkdir('artifacts/batch-five', { recursive: true })
await sharp({ create: { width: 1470, height: 4590, channels: 3, background: '#FFFFFF' } })
  .composite(tiles)
  .png()
  .toFile('artifacts/batch-five/contact-sheet.png')
for (const [category, layers] of Object.entries(categoryTiles)) {
  await sharp({
    create: {
      width: 1470,
      height: Math.ceil(layers.length / 4) * 460 - 10,
      channels: 3,
      background: '#FFFFFF',
    },
  })
    .composite(layers)
    .png()
    .toFile('artifacts/batch-five/' + category + '.png')
}
await writeFile(
  'artifacts/batch-five/verification.json',
  JSON.stringify(
    {
      styles: recipes.length,
      categoryCounts: counts,
      uniqueOriginals: hashes.size,
      uniqueScenes: scenes.size,
      exactSwatches: 160,
      browserImages: 80,
      dimensions: '1200 × 1500',
    },
    null,
    2,
  ) + '\n',
)
console.log('第五批验证通过：全部40份候选、40张独立场景与原图、160个精确色块、80张浏览图片。')
