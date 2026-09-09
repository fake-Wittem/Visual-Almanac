<script setup lang="ts">
withDefaults(
  defineProps<{
    preset?: 'fade' | 'page' | 'popup' | 'modal'
    mode?: 'out-in' | 'in-out' | 'default'
    appear?: boolean
  }>(),
  { preset: 'fade', appear: false, mode: 'default' },
)
// 退出中的元素保留视觉效果，但不能继续接受点击或键盘焦点。
function leave(el: Element) {
  ;(el as HTMLElement).inert = true
}
function enter(el: Element) {
  ;(el as HTMLElement).inert = false
}
</script>
<template>
  <Transition
    :name="`motion-${preset}`"
    :mode="mode"
    :appear="appear"
    @before-leave="leave"
    @before-enter="enter"
    @leave-cancelled="enter"
  >
    <slot />
  </Transition>
</template>
