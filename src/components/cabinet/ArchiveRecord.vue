<script setup lang="ts">
import RecordPalette from './RecordPalette.vue'
import { ArrowUpRight } from '@lucide/vue'
import type { Style } from '../../content/schema'
import { imageUrl } from '../../repositories/catalog'
import FavoriteButton from '../common/FavoriteButton.vue'
defineProps<{ style: Style; eager?: boolean; reason?: string }>()
</script>
<template>
  <article class="cabinet-record style-card">
    <RouterLink :to="`/styles/${style.id}`" class="record-cover" :aria-label="`查看 ${style.name}`">
      <img class="record-paper" src="/images/cabinet/folder-blank.webp" alt="" loading="lazy" />
      <span class="record-number">{{ String(style.order).padStart(3, '0') }}</span>
      <img
        class="record-poster"
        :src="imageUrl(style.cover, 'detail')"
        :alt="style.name + '参考海报'"
        :loading="eager ? 'eager' : 'lazy'"
      />
      <span class="record-open">打开档案 <ArrowUpRight :size="15" /></span>
    </RouterLink>
    <div class="record-caption">
      <div>
        <p>{{ style.englishName }}</p>
        <h2>
          <RouterLink :to="`/styles/${style.id}`">{{ style.name }}</RouterLink>
        </h2>
      </div>
      <FavoriteButton :id="style.id" :name="style.name" />
    </div>
    <p class="record-summary">{{ reason || style.summary }}</p>
    <RecordPalette :name="style.name" :colors="style.palettes[0]?.colors ?? []" />
  </article>
</template>
