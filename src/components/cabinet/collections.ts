import { categories } from '../../content/categories'

const definitions = [
  ['retro', 'retro-collage', 'TIME NEVER FADES.', '从旧媒介与生活场景，重读年代记忆。'],
  [
    'natural-organic',
    'botanical-collage',
    'NATURE · MATERIAL · LIFE',
    '自然连接万物，也滋养日常生活之美。',
  ],
  [
    'modern-minimal',
    'minimal-collage',
    'LESS, BUT A RICHER LIFE.',
    '以克制的表达，留下恰好的余白。',
  ],
  [
    'eastern-aesthetics',
    'eastern-collage',
    'IN HERITAGE WE FIND MEANING.',
    '一笔一境，收藏东方的含蓄与悠远。',
  ],
  [
    'classical-decorative',
    'classical-collage',
    'BEAUTY LIVES IN DETAILS.',
    '沿历史样式与工艺传统，读懂装饰的来处。',
  ],
  ['future-tech', 'digital-future', 'TOMORROW, IMAGINED.', '向尚未抵达的世界，借一点想象。'],
  ['avant-garde', 'generative-art', 'BEYOND THE FAMILIAR.', '打破惯常的观看，发现另一种可能。'],
  ['street-pop', 'graffiti-lettering', 'CULTURE IN MOTION.', '让街头的自由，进入日常的创作。'],
] as const

export const collections = definitions.map(([id, image, motto, description]) => ({
  ...categories.find((category) => category.id === id)!,
  image: `/images/cabinet/${image}.webp`,
  motto,
  description,
}))
