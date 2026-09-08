<script setup lang="ts">
import { SearchX } from '@lucide/vue'
defineProps<{ title: string; description?: string }>()
</script>
<template>
  <section class="empty-state">
    <SearchX :size="32" :stroke-width="1.2" />
    <h2 tabindex="-1">{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <slot />
  </section>
</template>
