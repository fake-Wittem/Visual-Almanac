import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseFilters, serializeFilters, type Filters } from '../domain/catalog'
export function useCatalogQuery() {
  const route = useRoute(),
    router = useRouter()
  const favorites = computed(() => route.path === '/favorites')
  const filters = computed(() => parseFilters(route.query, favorites.value))
  const apply = (value: Filters, replace = false) =>
    router[replace ? 'replace' : 'push']({ path: route.path, query: serializeFilters(value) })
  // 链接输入统一规范化，未知参数不污染筛选状态。
  watch(
    () => route.fullPath,
    () => {
      const normalized = serializeFilters(filters.value)
      if (JSON.stringify(route.query) !== JSON.stringify(normalized))
        void router.replace({ path: route.path, query: normalized })
    },
    { immediate: true },
  )
  return { favorites, filters, apply }
}
