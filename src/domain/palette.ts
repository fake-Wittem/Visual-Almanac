import type { Palette, Swatch } from '../content/schema'
export const usable = (colors: readonly Swatch[]) =>
  colors.filter((c) => c.status !== 'pending' && c.hex)
export const paletteText = (p: Palette) =>
  usable(p.colors)
    .map((c) => c.hex)
    .join(', ')
export const paletteCss = (styleId: string, p: Palette) =>
  ':root {\n' +
  usable(p.colors)
    .map((c) => `  --${styleId}-${p.id}-${c.id}: ${c.hex};`)
    .join('\n') +
  '\n}'
export const statusNames = {
  verified: '标注已核对',
  sampled: '近似取样',
  manual: '人工设定',
  pending: '待核对',
}
