<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImageOff, RotateCw } from '@lucide/vue'
const props = defineProps<{
  src: string
  alt: string
  width?: number
  height?: number
  eager?: boolean
}>()
const failed = ref(false),
  retry = ref(0)
watch(
  () => props.src,
  () => {
    failed.value = false
    retry.value = 0
  },
)
function retryImage() {
  failed.value = false
  retry.value++
}
</script>
<template>
  <div v-if="failed" class="image-error">
    <ImageOff :size="24" />
    <p>图片暂时无法加载</p>
    <button class="text-button" @click.stop="retryImage"><RotateCw :size="14" />重试</button>
  </div>
  <img
    v-else
    :src="src + (retry ? '?retry=' + retry : '')"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    @error="failed = true"
  />
</template>
