<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { Style } from '../../content/schema'
import { copyText } from '../../composables/useClipboard'

const props = defineProps<{ name: string; colors: Style['palettes'][number]['colors'] }>()
const displayColors = computed(() => props.colors.slice(0, 4))
const id = useId()
const paletteOpen = ref(false)
const paletteRoot = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
let pinned = false
let restoringFocus = false
let closeTimer: ReturnType<typeof setTimeout> | undefined

function showPalette() {
  if (restoringFocus || !displayColors.value.length) return
  clearTimeout(closeTimer)
  paletteOpen.value = true
}
function pinPalette() {
  pinned = true
  showPalette()
}
function closePalette() {
  clearTimeout(closeTimer)
  pinned = false
  paletteOpen.value = false
}
function dismissPalette() {
  closePalette()
  restoringFocus = true
  trigger.value?.focus({ preventScroll: true })
  restoringFocus = false
}
function hidePalette() {
  if (pinned || paletteRoot.value?.contains(document.activeElement)) return
  clearTimeout(closeTimer)
  closeTimer = setTimeout(closePalette, 180)
}
function leaveFocus(event: FocusEvent) {
  if (!paletteRoot.value?.contains(event.relatedTarget as Node | null)) closePalette()
}
function outsidePalette(event: PointerEvent) {
  if (!paletteRoot.value?.contains(event.target as Node)) closePalette()
}
// Closed cards own no document listeners; cleanup also runs when the card unmounts.
watch(
  paletteOpen,
  (open, _, onCleanup) => {
    if (!open) return
    document.addEventListener('pointerdown', outsidePalette)
    onCleanup(() => document.removeEventListener('pointerdown', outsidePalette))
  },
  { flush: 'sync' },
)
onBeforeUnmount(() => clearTimeout(closeTimer))
</script>
<template>
  <div
    ref="paletteRoot"
    class="record-colors"
    @mouseenter="showPalette"
    @mouseleave="hidePalette"
    @focusin="showPalette"
    @focusout="leaveFocus"
    @keydown.esc.stop.prevent="dismissPalette"
  >
    <button
      ref="trigger"
      class="record-palette-trigger"
      type="button"
      :aria-label="`${name}：查看并复制参考配色`"
      :aria-expanded="paletteOpen"
      :disabled="!displayColors.length"
      :aria-controls="id"
      @click="pinPalette"
    >
      <span
        v-for="color in displayColors"
        :key="color.id"
        :style="{ backgroundColor: color.hex || '#d9d3c3' }"
      />
    </button>
    <div
      v-if="paletteOpen"
      :id="id"
      class="record-palette-popover"
      role="group"
      aria-label="复制参考配色"
    >
      <p class="record-palette-heading">参考配色 · 点击复制色值</p>
      <div v-for="color in displayColors" :key="color.id" class="record-palette-row">
        <span class="record-palette-chip" :style="{ backgroundColor: color.hex || '#d9d3c3' }" />
        <div>
          <span>{{ color.name }}</span
          ><code>{{ color.hex || '未提供色值' }}</code>
        </div>
        <button
          v-if="color.hex"
          type="button"
          :aria-label="`复制 ${color.name} ${color.hex}`"
          @click="copyText(color.hex)"
        >
          复制
        </button>
      </div>
    </div>
  </div>
</template>
