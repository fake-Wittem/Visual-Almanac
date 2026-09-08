<script setup lang="ts">
import EmptyState from '../components/common/EmptyState.vue'
</script>
<template>
  <div class="page-width">
    <EmptyState title="这份档案暂时找不到" description="链接可能已变更，回到档案馆继续探索。"
      ><RouterLink to="/" class="primary-button">返回全部档案</RouterLink></EmptyState
    >
  </div>
</template>
