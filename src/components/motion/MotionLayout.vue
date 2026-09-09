<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
const root = ref<HTMLElement>()
const content = ref<HTMLElement>()
let observer: ResizeObserver | undefined
let animation: Animation | undefined
let previousHeight = 0
let media: MediaQueryList | undefined
function cancel() {
  animation?.cancel()
  animation = undefined
}
onMounted(() => {
  if (!root.value || !content.value) return
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', cancel)
  previousHeight = content.value.getBoundingClientRect().height
  observer = new ResizeObserver(() => {
    if (!root.value || !content.value) return
    const height = content.value.getBoundingClientRect().height
    if (Math.abs(height - previousHeight) < 1) return
    const from = animation ? root.value.getBoundingClientRect().height : previousHeight
    previousHeight = height
    cancel()
    if (media?.matches) return
    const tokens = getComputedStyle(root.value)
    const current = root.value.animate([{ height: `${from}px` }, { height: `${height}px` }], {
      duration: parseFloat(tokens.getPropertyValue('--motion-layout-duration')) || 280,
      easing: tokens.getPropertyValue('--motion-ease').trim() || 'ease-out',
    })
    animation = current
    void current.finished.then(
      () => {
        if (animation === current) animation = undefined
      },
      () => {},
    )
  })
  observer.observe(content.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  media?.removeEventListener('change', cancel)
  cancel()
})
</script>
<template>
  <div ref="root" class="motion-layout">
    <div ref="content" class="motion-layout-content"><slot /></div>
  </div>
</template>
