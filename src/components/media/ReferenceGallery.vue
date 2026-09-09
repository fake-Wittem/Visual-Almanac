<script setup lang="ts">
import { ref } from 'vue'
import { Expand } from '@lucide/vue'
import type { Style } from '../../content/schema'
import { assetById, imageUrl } from '../../repositories/catalog'
import ArchiveImage from './ArchiveImage.vue'
import ImageViewer from './ImageViewer.vue'
const props = defineProps<{ style: Style }>()
const selected = ref(
    Math.max(
      0,
      props.style.images.findIndex((i) => i.asset === props.style.cover),
    ),
  ),
  expanded = ref(false)
</script>
<template>
  <section class="reference-gallery" aria-label="参考图库">
    <div class="detail-image-wrap">
      <button
        class="detail-image-button"
        :aria-label="'放大 ' + style.name + ' 参考图'"
        @click="expanded = true"
      >
        <ArchiveImage
          :src="imageUrl(style.images[selected]!.asset, 'detail')"
          :alt="style.images[selected]!.caption"
          :width="assetById(style.images[selected]!.asset).width"
          :height="assetById(style.images[selected]!.asset).height"
          eager
        /></button
      ><button class="expand-image" @click="expanded = true"><Expand :size="15" /> 查看原图</button>
    </div>
    <div class="image-caption">
      <span>{{ style.images[selected]!.caption }}</span
      ><span v-if="style.images.length > 1">{{ selected + 1 }} / {{ style.images.length }}</span
      ><span v-else>AI 生成参考图</span>
    </div>
    <div v-if="style.images.length > 1" class="thumbnail-list">
      <button
        v-for="(im, i) in style.images"
        :key="im.asset"
        :aria-label="im.caption"
        :aria-pressed="i === selected"
        @click="selected = i"
      >
        <img :src="imageUrl(im.asset)" :alt="im.caption" />
      </button>
    </div>
    <ImageViewer v-model:open="expanded" :images="style.images" :initial="selected" />
  </section>
</template>
