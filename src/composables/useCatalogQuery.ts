import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseFilters, serializeFilters, type Filters } from '../domain/catalog'
export function useCatalogQuery() {
  const route = useRoute(),
    router = useRouter()
  // 离场动画期间冻结旧页面的查询，避免旧页面响应新路由并重写 URL。
  const listingPath = route.path
  const favorites = computed(() => listingPath === '/favorites')
  const query = shallowRef(route.query)
  const filters = computed(() => parseFilters(query.value, favorites.value))
  const apply = (value: Filters, replace = false) =>
    router[replace ? 'replace' : 'push']({ path: listingPath, query: serializeFilters(value) })
  // 链接输入统一规范化，未知参数不污染筛选状态。
  watch(
    () => route.fullPath,
    () => {
      if (route.path !== listingPath) return
      query.value = route.query
      const normalized = serializeFilters(filters.value)
      if (JSON.stringify(route.query) !== JSON.stringify(normalized))
        void router.replace({ path: route.path, query: normalized })
    },
    { immediate: true },
  )
  return { favorites, filters, apply }
}
