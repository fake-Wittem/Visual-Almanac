<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, Code, Check } from '@lucide/vue'
import type { Palette } from '../../content/schema'
import { usable, paletteText, paletteCss, statusNames } from '../../domain/palette'
import { copyText } from '../../composables/useClipboard'
const props = defineProps<{ palettes: Palette[]; styleId: string }>()
const selected = ref(0),
  backdrop = ref('#efefed')
watch(
  () => props.styleId,
  () => (selected.value = 0),
)
const palette = computed(() => props.palettes[selected.value])
const available = computed(() => (palette.value ? usable(palette.value.colors) : []))
</script>
<template>
  <section v-if="palette" class="palette-panel" aria-labelledby="palette-title">
    <div class="section-label">
      <span class="eyebrow">COLOR PALETTE</span
      ><span>{{ String(palette.colors.length).padStart(2, '0') }} COLORS</span>
    </div>
    <h2 id="palette-title">把这组颜色，带进你的设计。</h2>
    <div v-if="palettes.length > 1" class="palette-tabs" role="tablist" aria-label="配色方案">
      <button
        v-for="(p, i) in palettes"
        :key="p.id"
        role="tab"
        :aria-selected="i === selected"
        @click="selected = i"
      >
        {{ p.name }}
      </button>
    </div>
    <p class="palette-description">{{ palette.description }}</p>
    <div class="palette-preview" :style="{ background: backdrop }">
      <span
        v-for="c in available"
        :key="c.id"
        :style="{ background: c.hex! }"
        :title="c.name"
      /><span v-if="!available.length" class="pending-preview">配色待核对</span>
    </div>
    <div class="background-controls">
      <span>观察底色</span
      ><button
        v-for="b in [
          { hex: '#ffffff', name: '白色' },
          { hex: '#efefed', name: '浅灰' },
          { hex: '#343434', name: '深灰' },
        ]"
        :key="b.hex"
        :style="{ background: b.hex, color: b.hex === '#343434' ? 'white' : '#343434' }"
        :aria-label="b.name + '观察底色'"
        :aria-pressed="backdrop === b.hex"
        @click="backdrop = b.hex"
      >
        <Check v-if="backdrop === b.hex" :size="12" />
      </button>
    </div>
    <div class="swatch-list">
      <div v-for="c in palette.colors" :key="c.id" class="swatch-row">
        <span
          class="swatch-dot"
          :style="{ background: c.status !== 'pending' ? c.hex || '#eee' : '#eee' }"
        />
        <div class="swatch-name">
          <span
            >{{ c.name }}<small v-if="c.role"> · {{ c.role }}</small></span
          ><small>{{ statusNames[c.status] }}</small>
        </div>
        <code>{{ c.status === 'pending' ? '待核对' : c.hex }}</code
        ><button
          class="icon-button"
          :disabled="c.status === 'pending' || !c.hex"
          :aria-label="`复制 ${c.name} 色值`"
          @click="copyText(c.hex!)"
        >
          <Copy :size="15" />
        </button>
      </div>
    </div>
    <div class="palette-actions">
      <button
        class="primary-button"
        :disabled="!available.length"
        @click="copyText(paletteText(palette))"
      >
        <Copy :size="15" />{{
          available.length === palette.colors.length
            ? '复制整组配色'
            : `仅复制已确认的 ${available.length} 色`
        }}</button
      ><button
        class="secondary-button"
        :disabled="!available.length"
        @click="copyText(paletteCss(styleId, palette))"
      >
        <Code :size="16" />复制 CSS
      </button>
    </div>
  </section>
</template>
