<script setup lang="ts">
import { ref, useId } from 'vue'
defineProps<{ label: string; color: string }>()
const id = useId()
const dismissed = ref(false)
</script>
<template>
  <span
    class="color-tooltip"
    :class="{ dismissed }"
    :style="{ background: color }"
    tabindex="0"
    :aria-label="label"
    :aria-describedby="id"
    @mouseenter="dismissed = false"
    @focus="dismissed = false"
    @keydown.esc="dismissed = true"
  >
    <span :id="id" role="tooltip" class="tooltip-content"
      >{{ label }}<small>{{ color }}</small></span
    >
  </span>
</template>
