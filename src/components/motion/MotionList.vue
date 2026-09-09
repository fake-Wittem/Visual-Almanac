<script setup lang="ts">
withDefaults(defineProps<{ tag?: string; appear?: boolean }>(), { tag: 'div', appear: false })
// 脱离文档流前保留尺寸和坐标，让 Vue 的 FLIP 位移动画保持网格布局。
function leave(element: Element) {
  const el = element as HTMLElement
  el.style.width = `${el.offsetWidth}px`
  el.style.height = `${el.offsetHeight}px`
  el.style.left = `${el.offsetLeft}px`
  el.style.top = `${el.offsetTop}px`
  el.inert = true
}
function reset(element: Element) {
  const el = element as HTMLElement
  for (const property of ['width', 'height', 'left', 'top']) el.style.removeProperty(property)
  el.inert = false
}
</script>
<template>
  <TransitionGroup
    name="motion-list"
    :tag="tag"
    :appear="appear"
    class="motion-list"
    @before-leave="leave"
    @after-leave="reset"
    @leave-cancelled="reset"
    @before-enter="reset"
  >
    <slot />
  </TransitionGroup>
</template>
