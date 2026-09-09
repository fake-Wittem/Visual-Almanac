<script setup lang="ts">
import { Bookmark } from '@lucide/vue'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useFavorites } from '../../composables/useFavorites'
import { notify } from '../../composables/useToast'
const props = defineProps<{ id: string; name: string; labeled?: boolean }>()
const { has, saved, set } = useFavorites(),
  route = useRoute()
async function toggle(event: MouseEvent) {
  const removing = has(props.id),
    old = saved.value[props.id]
  const button = event.currentTarget as HTMLElement
  const buttons = [
    ...document.querySelectorAll<HTMLElement>('.style-card:not([inert]) .favorite-button'),
  ]
  const index = buttons.indexOf(button)
  set(props.id, removing ? null : Date.now())
  notify(removing ? '已取消收藏' : '已收藏', removing ? () => set(props.id, old!) : undefined)
  if (removing && route.path === '/favorites') {
    await nextTick()
    const remaining = [
      ...document.querySelectorAll<HTMLElement>('.style-card:not([inert]) .favorite-button'),
    ]
    ;(
      remaining[Math.min(index, remaining.length - 1)] ||
      document.querySelector<HTMLElement>('.empty-state h2')
    )?.focus()
  }
}
</script>
<template>
  <button
    class="favorite-button"
    :class="{ saved: has(id), labeled }"
    :aria-label="`${has(id) ? '取消收藏' : '收藏'} ${name}`"
    :aria-pressed="has(id)"
    @click="toggle"
  >
    <Bookmark :size="18" :fill="has(id) ? 'currentColor' : 'none'" :stroke-width="1.6" /><span
      v-if="labeled"
      >{{ has(id) ? '已收藏' : '收藏风格' }}</span
    >
  </button>
</template>
