import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const text = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !v.includes('{{'), '不能保留未填写的占位符')
const hex = z.string().regex(/^#[0-9A-F]{6}$/, 'HEX 使用大写六位格式，例如 #F2EFE7')
const schema = z
  .object({
    styleName: text,
    styleEn: text,
    titlePrimary: text,
    titleAccent: text,
    titlePrimaryHex: hex,
    titleAccentHex: hex,
    scene: text,
    foreground: text,
    midground: text,
    background: text,
    composition: text,
    materials: text,
    lighting: text,
    mood: text,
    medium: text,
    colors: z.array(z.object({ name: text, hex, englishName: text })).length(4),
    sidebarCn: z.array(text.max(12, '每行中文建议不超过12字')).length(4),
    sidebarEn: z.array(text.max(28, '每行英文最多28字符')).length(2),
    badges: z.array(text.min(2).max(4)).length(3),
    avoid: text,
  })
  .refine((v) => [...v.titlePrimary, ...v.titleAccent].length <= 12, '展示标题最多12字，请缩短名称')
  .refine((v) => v.titlePrimary + v.titleAccent === v.styleName, '标题两片段拼接必须等于风格名称')

async function main() {
  const input = process.argv[2],
    output = process.argv[3]
  if (!input) throw Error('用法：npm run poster:prompt -- <参数.json> [输出.md]')
  const config = schema.parse(JSON.parse(await readFile(input, 'utf8')))
  const templatePath = fileURLToPath(
    new URL('../templates/posters/prompt.template.md', import.meta.url),
  )
  const values: Record<string, string> = {
    STYLE_NAME: config.styleName,
    STYLE_EN: config.styleEn,
    TITLE_PRIMARY: config.titlePrimary,
    TITLE_ACCENT: config.titleAccent,
    TITLE_PRIMARY_HEX: config.titlePrimaryHex,
    TITLE_ACCENT_HEX: config.titleAccentHex,
    PALETTE_NAMES: config.colors.map((c) => c.name).join(' / '),
    SCENE: config.scene,
    FOREGROUND: config.foreground,
    MIDGROUND: config.midground,
    BACKGROUND: config.background,
    COMPOSITION: config.composition,
    MATERIALS: config.materials,
    LIGHTING: config.lighting,
    MOOD: config.mood,
    MEDIUM: config.medium,
    COLOR_ROWS: config.colors
      .map((c, i) => `${i + 1}. ${c.name} | ${c.hex} | ${c.englishName}`)
      .join('\n'),
    SIDEBAR_CN: config.sidebarCn.join('\n'),
    SIDEBAR_EN: config.sidebarEn.join('\n'),
    BADGES: config.badges.join(' / '),
    AVOID: config.avoid,
  }
  const prompt = (await readFile(templatePath, 'utf8')).replace(
    /\{\{([A-Z_]+)\}\}/g,
    (_, key: string) => {
      if (!(key in values)) throw Error(`未知模板变量：${key}`)
      return values[key]!
    },
  )
  if (output) {
    const dest = resolve(output)
    await mkdir(dirname(dest), { recursive: true })
    // 不覆盖已有文件，防止误把输入参数或母版路径当作输出。
    await writeFile(dest, prompt, { encoding: 'utf8', flag: 'wx' })
    console.log(`已生成提示词：${dest}`)
  } else console.log(prompt)
}
main().catch((error) => {
  if (error instanceof z.ZodError)
    console.error(error.issues.map((i) => `${i.path.join('.') || '参数'}：${i.message}`).join('\n'))
  else console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
