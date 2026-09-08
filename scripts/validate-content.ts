import { readFile, readdir, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { styleSchema, assetSchema, type Style } from '../src/content/schema'
import { categories } from '../src/content/categories'
import { tags } from '../src/content/tags'

const errors: string[] = []
const unique = (ids: string[], label: string) => {
  if (new Set(ids).size !== ids.length) errors.push(`${label}: 存在重复 ID`)
}
const assets = assetSchema
  .array()
  .parse(JSON.parse(await readFile('src/content/assets/manifest.json', 'utf8')))
unique(
  assets.map((a) => a.id),
  'assets/manifest.json',
)
unique(
  tags.map((t) => t.id),
  'tags.ts',
)
unique(
  categories.map((c) => c.id),
  'categories.ts',
)
for (const asset of assets) {
  try {
    await access(resolve('public', asset.file))
  } catch {
    errors.push(`${asset.id}: 图片不存在 ${asset.file}`)
  }
}
const styles: { file: string; data: Style }[] = []
for (const file of (await readdir('src/content/styles')).filter((f) => f.endsWith('.json'))) {
  try {
    const result = styleSchema.safeParse(
      JSON.parse(await readFile(`src/content/styles/${file}`, 'utf8')),
    )
    if (!result.success)
      for (const issue of result.error.issues)
        errors.push(`${file}:${issue.path.join('.')}: ${issue.message}`)
    else styles.push({ file, data: result.data })
  } catch (e) {
    errors.push(`${file}: ${String(e)}`)
  }
}
unique(
  styles.map((s) => s.data.id),
  'styles',
)
for (const { file, data: s } of styles) {
  if (!categories.some((c) => c.id === s.category)) errors.push(`${file}: category 无效`)
  for (const t of s.tags)
    if (!tags.some((tag) => tag.id === t)) errors.push(`${file}: tags.${t} 不存在`)
  for (const im of s.images)
    if (!assets.some((a) => a.id === im.asset)) errors.push(`${file}: images.${im.asset} 不存在`)
  for (const id of s.related)
    if (id === s.id || !styles.some((x) => x.data.id === id))
      errors.push(`${file}: related.${id} 无效`)
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`内容校验通过：${styles.length} 份档案，${assets.length} 张原图。`)
