<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import MotionTransition from '../motion/MotionTransition.vue'
defineProps<{ label: string; kind?: string }>()
const open = defineModel<boolean>('open', { default: false })
const el = ref<HTMLDialogElement>()
let previous: HTMLElement | null = null
let oldOverflow = ''
let locked = false
async function show(element: Element) {
  if (!locked) {
    previous = document.activeElement as HTMLElement | null
    oldOverflow = document.body.style.overflow
    locked = true
  }
  // before-enter 时元素尚未插入；挂载后才能调用 showModal。
  await nextTick()
  if (!open.value || !element.isConnected) return
  ;(element as HTMLDialogElement).showModal()
  document.body.style.overflow = 'hidden'
}
function release() {
  if (!locked) return
  el.value?.close()
  document.body.style.overflow = oldOverflow
  locked = false
  if (previous?.isConnected) previous.focus({ preventScroll: true })
}
onBeforeUnmount(release)
</script>
<template>
  <Teleport to="body">
    <MotionTransition preset="modal" @before-enter="show" @after-leave="release">
      <dialog
        v-if="open"
        ref="el"
        :class="['modal', kind]"
        :aria-label="label"
        @cancel.prevent="open = false"
        @click="$event.target === el && (open = false)"
      >
        <slot />
      </dialog>
    </MotionTransition>
  </Teleport>
</template>
