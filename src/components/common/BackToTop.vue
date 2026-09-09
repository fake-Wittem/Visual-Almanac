<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { ArrowUp } from '@lucide/vue'
import MotionTransition from '../motion/MotionTransition.vue'

const visible = ref(false)
const update = () => (visible.value = window.scrollY > 0)
function backToTop() {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', update))
</script>
<template>
  <MotionTransition preset="popup">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      aria-label="返回顶部"
      @click="backToTop"
    >
      <ArrowUp :size="19" :stroke-width="1.5" />
      <span>顶部</span>
    </button>
  </MotionTransition>
</template>
