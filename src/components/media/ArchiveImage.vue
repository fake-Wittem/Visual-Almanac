<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ImageOff, RotateCw } from '@lucide/vue'
import MotionTransition from '../motion/MotionTransition.vue'
const props = defineProps<{
  src: string
  alt: string
  width?: number
  height?: number
  eager?: boolean
}>()
const failed = ref(false),
  retry = ref(0)
const loaded = ref(false)
const image = ref<HTMLImageElement>()
onMounted(() => {
  if (image.value?.complete && image.value.naturalWidth) loaded.value = true
})
watch(
  () => props.src,
  () => {
    failed.value = false
    retry.value = 0
    loaded.value = false
  },
)
function retryImage() {
  failed.value = false
  loaded.value = false
  retry.value++
}
</script>
<template>
  <MotionTransition mode="out-in">
    <div v-if="failed" class="image-error">
      <ImageOff :size="24" />
      <p>图片暂时无法加载</p>
      <button class="text-button" @click.stop="retryImage"><RotateCw :size="14" />重试</button>
    </div>
    <img
      v-else
      :key="src + retry"
      ref="image"
      class="archive-image"
      :class="{ 'is-loaded': loaded }"
      :src="src + (retry ? '?retry=' + retry : '')"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      @load="loaded = true"
      @error="failed = true"
    />
  </MotionTransition>
</template>
