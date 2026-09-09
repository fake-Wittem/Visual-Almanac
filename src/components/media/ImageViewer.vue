<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { X, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from '@lucide/vue'
import ModalDialog from '../common/ModalDialog.vue'
import ArchiveImage from './ArchiveImage.vue'
import { imageUrl } from '../../repositories/catalog'
import { useMotionNumber } from '../../composables/useMotionNumber'
const props = defineProps<{ images: { asset: string; caption: string }[]; initial: number }>()
const open = defineModel<boolean>('open', { default: false })
watch(open, (value) => {
  if (value) {
    index.value = props.initial
    zoom.value = 1
  }
})
const index = ref(props.initial),
  zoom = ref(1),
  stage = ref<HTMLElement>()
const current = computed(() => props.images[index.value]!)
const displayZoom = useMotionNumber(zoom)
// 缩放围绕当前视口中心，避免放大后跳到画布边缘。
watch(displayZoom, async (value, old) => {
  if (!stage.value) return
  const x = ((stage.value.scrollLeft + stage.value.clientWidth / 2) * value) / old
  const y = ((stage.value.scrollTop + stage.value.clientHeight / 2) * value) / old
  await nextTick()
  if (stage.value) {
    stage.value.scrollLeft = x - stage.value.clientWidth / 2
    stage.value.scrollTop = y - stage.value.clientHeight / 2
  }
})
function change(delta: number) {
  index.value = (index.value + delta + props.images.length) % props.images.length
  zoom.value = 1
}
let drag: { x: number; y: number; left: number; top: number } | null = null
function start(e: PointerEvent) {
  if (zoom.value <= 1) return
  stage.value?.setPointerCapture(e.pointerId)
  drag = { x: e.clientX, y: e.clientY, left: stage.value!.scrollLeft, top: stage.value!.scrollTop }
}
function move(e: PointerEvent) {
  if (drag && stage.value) {
    stage.value.scrollLeft = drag.left - (e.clientX - drag.x)
    stage.value.scrollTop = drag.top - (e.clientY - drag.y)
  }
}
</script>
<template>
  <ModalDialog v-model:open="open" label="全屏参考图" kind="viewer-dialog"
    ><div
      class="viewer-content"
      @keydown.left.prevent="change(-1)"
      @keydown.right.prevent="change(1)"
    >
      <div class="viewer-toolbar">
        <span
          >{{ current.caption }}
          <small v-if="images.length > 1">{{ index + 1 }} / {{ images.length }}</small></span
        >
        <div>
          <button
            class="icon-button"
            aria-label="缩小"
            :disabled="zoom <= 1"
            @click="zoom = Math.max(1, zoom - 0.5)"
          >
            <ZoomOut :size="20" /></button
          ><button
            class="icon-button"
            aria-label="放大"
            :disabled="zoom >= 3"
            @click="zoom = Math.min(3, zoom + 0.5)"
          >
            <ZoomIn :size="20" /></button
          ><button class="icon-button" aria-label="重置适配" @click="zoom = 1">
            <Maximize :size="19" /></button
          ><button class="icon-button" aria-label="关闭大图" @click="open = false">
            <X :size="23" />
          </button>
        </div>
      </div>
      <div
        ref="stage"
        class="viewer-stage"
        :class="{ zoomed: zoom > 1 }"
        @pointerdown="start"
        @pointermove="move"
        @pointerup="drag = null"
        @pointercancel="drag = null"
      >
        <div
          class="viewer-image"
          :style="{ width: displayZoom * 100 + '%', height: displayZoom * 100 + '%' }"
        >
          <ArchiveImage
            :key="current.asset"
            :src="imageUrl(current.asset, 'original')"
            :alt="current.caption"
            eager
          />
        </div>
      </div>
      <div v-if="images.length > 1" class="viewer-pagination">
        <button class="secondary-button" @click="change(-1)"><ChevronLeft />上一张</button
        ><button class="secondary-button" @click="change(1)">下一张<ChevronRight /></button>
      </div></div
  ></ModalDialog>
</template>
