<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
defineProps<{ label: string; kind?: string }>()
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement>(),
  previous = document.activeElement as HTMLElement | null
const oldOverflow = document.body.style.overflow
onMounted(() => {
  el.value?.showModal()
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = oldOverflow
  previous?.focus()
})
</script>
<template>
  <Teleport to="body"
    ><dialog
      ref="el"
      :class="['modal', kind]"
      :aria-label="label"
      @cancel.prevent="emit('close')"
      @click="$event.target === el && emit('close')"
    >
      <slot /></dialog
  ></Teleport>
</template>
