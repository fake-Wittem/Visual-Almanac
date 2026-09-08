<script setup lang="ts">
import type { Style } from '../../content/schema'
import { tags } from '../../content/tags'
import { assetById, imageUrl } from '../../repositories/catalog'
import { usable } from '../../domain/palette'
import FavoriteButton from '../common/FavoriteButton.vue'
import ArchiveImage from '../media/ArchiveImage.vue'
defineProps<{ style: Style; eager?: boolean; reason?: string }>()
</script>
<template>
  <article class="style-card">
    <RouterLink :to="`/styles/${style.id}`" class="poster-link" :aria-label="`查看 ${style.name}`"
      ><ArchiveImage
        :src="imageUrl(style.cover)"
        :alt="style.name + '参考海报'"
        :width="assetById(style.cover).width"
        :height="assetById(style.cover).height"
        :eager="eager"
    /></RouterLink>
    <div class="card-heading">
      <div>
        <span class="eyebrow card-english">{{ style.englishName }}</span>
        <h2>
          <RouterLink :to="`/styles/${style.id}`">{{ style.name }}</RouterLink>
        </h2>
      </div>
      <FavoriteButton :id="style.id" :name="style.name" />
    </div>
    <p class="card-summary">{{ reason || style.summary }}</p>
    <div
      v-if="style.palettes[0] && usable(style.palettes[0].colors).length"
      class="card-palette"
      aria-label="参考配色"
    >
      <span
        v-for="c in usable(style.palettes[0].colors).slice(0, 5)"
        :key="c.id"
        :style="{ background: c.hex! }"
        :title="c.name"
      />
    </div>
    <div class="card-tags">
      <span
        v-for="id in style.tags
          .filter((id) => tags.find((t) => t.id === id)?.dimension !== 'usage')
          .slice(0, 3)"
        :key="id"
        >{{ tags.find((t) => t.id === id)?.name }}</span
      >
    </div>
  </article>
</template>
