<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Search, SlidersHorizontal, X, ArrowUpRight, ChevronLeft, ChevronRight } from '@lucide/vue'
import { catalog } from '../repositories/catalog'
import { tags } from '../content/tags'
import { categories } from '../content/categories'
import { dimensions } from '../content/schema'
import { emptyFilters, filterStyles, sortStyles, pageStyles, type Filters } from '../domain/catalog'
import { useCatalogQuery } from '../composables/useCatalogQuery'
import { useFavorites } from '../composables/useFavorites'
import StyleCard from '../components/catalog/StyleCard.vue'
import FilterPanel from '../components/catalog/FilterPanel.vue'
import EmptyState from '../components/common/EmptyState.vue'
import ModalDialog from '../components/common/ModalDialog.vue'
import ArchiveSelect from '../components/common/ArchiveSelect.vue'
import MotionList from '../components/motion/MotionList.vue'
import MotionLayout from '../components/motion/MotionLayout.vue'
import MotionTransition from '../components/motion/MotionTransition.vue'
const sortOptions = computed(() => [
  { value: 'order', label: '档案顺序' },
  { value: 'updated', label: '最近更新' },
  { value: 'name', label: '名称 A–Z' },
  ...(favorites.value ? [{ value: 'saved', label: '最近收藏' }] : []),
])
const { favorites, filters, apply } = useCatalogQuery(),
  { has, saved } = useFavorites()
const base = computed(() => catalog.list().filter((s) => !favorites.value || has(s.id)))
const results = computed(() =>
  sortStyles(filterStyles(base.value, filters.value), filters.value.sort, saved.value),
)
const pagination = computed(() => pageStyles(results.value, filters.value.page))
const search = ref(filters.value.q),
  composing = ref(false)
let searchTimer: ReturnType<typeof setTimeout>
watch(
  () => filters.value.q,
  (v) => {
    search.value = v
  },
)
watch(
  () => pagination.value.page,
  (p) => {
    if (p !== filters.value.page) void apply({ ...filters.value, page: p }, true)
  },
  { immediate: true },
)
function submitSearch(immediate = false) {
  clearTimeout(searchTimer)
  if (composing.value) return
  const run = () => void apply({ ...filters.value, q: search.value.trim(), page: 1 }, true)
  if (immediate) run()
  else searchTimer = setTimeout(run, 200)
}
onBeforeUnmount(() => clearTimeout(searchTimer))
const active = computed(() => [
  ...(filters.value.q ? [{ id: 'q', name: `搜索：${filters.value.q}`, dimension: 'q' }] : []),
  ...(filters.value.category
    ? [
        {
          id: filters.value.category,
          name: categories.find((c) => c.id === filters.value.category)!.name,
          dimension: 'category',
        },
      ]
    : []),
  ...dimensions.flatMap((d) =>
    filters.value[d].map((id) => ({ id, name: tags.find((t) => t.id === id)!.name, dimension: d })),
  ),
])
function remove(d: string, id: string) {
  const f = { ...filters.value, page: 1 }
  if (d === 'q') f.q = ''
  else if (d === 'category') f.category = ''
  else {
    const dim = d as (typeof dimensions)[number]
    f[dim] = f[dim].filter((t) => t !== id)
  }
  void apply(f)
}
const clear = () => apply({ ...emptyFilters(favorites.value), sort: filters.value.sort })
const drawer = ref(false),
  draft = ref<Filters>(emptyFilters())
function openFilters() {
  draft.value = structuredClone(filters.value)
  drawer.value = true
}
const draftCount = computed(() => filterStyles(base.value, draft.value).length)
async function page(p: number) {
  await apply({ ...filters.value, page: p })
  await nextTick()
  document.querySelector('.catalog-heading')?.scrollIntoView({ block: 'start' })
}
watch(
  favorites,
  (v) => {
    document.title = `${v ? '我的收藏' : '全部档案'} · Visual Almanac`
  },
  { immediate: true },
)
function endComposition() {
  composing.value = false
  submitSearch()
}
function clearSearch() {
  search.value = ''
  submitSearch(true)
}
function applyDraft() {
  void apply(draft.value)
  drawer.value = false
}
</script>
<template>
  <div class="catalog-layout page-width">
    <aside class="desktop-filters" aria-label="筛选档案">
      <FilterPanel :model-value="filters" :items="base" @update:model-value="apply($event)" />
    </aside>
    <section class="catalog-content">
      <div class="catalog-heading">
        <div>
          <p class="eyebrow">
            {{ favorites ? 'YOUR PERSONAL COLLECTION' : 'THE VISUAL ARCHIVE'
            }}<span class="eyebrow-line" />
          </p>
          <h1>{{ favorites ? '心动的风格，留在这里。' : '让灵感，有迹可循。' }}</h1>
          <p class="page-description">
            {{
              favorites
                ? '收藏保存在当前浏览器中，随时回来重拾灵感。'
                : '从一张图、一组颜色开始，发现属于你的视觉语言。'
            }}
          </p>
        </div>
        <span class="archive-count"
          ><b>{{ String(base.length).padStart(2, '0') }}</b
          ><span>{{ favorites ? '份收藏' : '份风格档案' }}</span></span
        >
      </div>
      <div class="catalog-tools">
        <form class="search-field" role="search" @submit.prevent="submitSearch(true)">
          <Search :size="18" /><input
            v-model="search"
            aria-label="搜索风格、别名或关键词"
            placeholder="搜索风格、别名或关键词…"
            @input="submitSearch()"
            @compositionstart="composing = true"
            @compositionend="endComposition"
          /><MotionTransition
            ><button
              v-if="search"
              type="button"
              class="icon-button"
              aria-label="清空搜索"
              @click="clearSearch"
            >
              <X :size="16" /></button></MotionTransition
          ><kbd aria-hidden="true">⌕</kbd>
        </form>
        <button class="mobile-filter-button" @click="openFilters">
          <SlidersHorizontal :size="17" />筛选<span v-if="active.length">{{
            active.length
          }}</span></button
        ><ArchiveSelect
          label="排序"
          :model-value="filters.sort"
          :options="sortOptions"
          @update:model-value="apply({ ...filters, sort: $event, page: 1 })"
        />
      </div>
      <MotionLayout
        ><MotionList class="active-filters" :class="{ 'has-filters': active.length }">
          <button v-for="a in active" :key="a.dimension + a.id" @click="remove(a.dimension, a.id)">
            {{ a.name }}<X :size="12" /></button
          ><button v-if="active.length" key="clear" class="clear-filters" @click="clear">
            清除条件
          </button>
        </MotionList></MotionLayout
      >
      <div class="result-heading">
        <span aria-live="polite"
          >{{ active.length ? '筛选结果' : '所有' + (favorites ? '收藏' : '风格') }}
          <MotionTransition mode="out-in"
            ><span :key="results.length" class="result-number">{{
              results.length
            }}</span></MotionTransition
          ></span
        ><span class="result-note"
          >{{ favorites ? '为下一次创作保留灵感' : '不同风格，同样值得细看'
          }}<ArrowUpRight :size="13"
        /></span>
      </div>
      <MotionLayout
        ><MotionList class="style-grid">
          <StyleCard v-for="(s, i) in pagination.items" :key="s.id" :style="s" :eager="i < 3" />
        </MotionList>
        <MotionTransition
          ><EmptyState
            v-if="!pagination.items.length"
            :title="
              favorites && !base.length
                ? '还没有收藏的风格'
                : '没有符合条件的' + (favorites ? '收藏' : '风格')
            "
            :description="
              favorites && !base.length
                ? '遇到喜欢的风格，点击书签就能留在这里。'
                : '试着减少筛选条件，给灵感多一点空间。'
            "
            ><RouterLink v-if="favorites && !base.length" class="primary-button" to="/"
              >浏览全部档案 <ArrowUpRight :size="16" /></RouterLink
            ><button v-else class="primary-button" @click="clear">清除条件</button></EmptyState
          ></MotionTransition
        ></MotionLayout
      >
      <MotionTransition
        ><nav v-if="pagination.pages > 1" class="pagination" aria-label="结果分页">
          <button
            :disabled="pagination.page === 1"
            aria-label="上一页"
            @click="page(pagination.page - 1)"
          >
            <ChevronLeft :size="18" /></button
          ><button
            v-for="p in pagination.pages"
            :key="p"
            :aria-current="p === pagination.page ? 'page' : undefined"
            @click="page(p)"
          >
            {{ p }}</button
          ><button
            :disabled="pagination.page === pagination.pages"
            aria-label="下一页"
            @click="page(pagination.page + 1)"
          >
            <ChevronRight :size="18" />
          </button></nav
      ></MotionTransition>
      <MotionTransition mode="out-in"
        ><p
          v-if="pagination.items.length"
          :key="results.length === base.length ? 'all' : 'filtered'"
          class="catalog-end"
        >
          {{
            results.length === base.length
              ? '每一种风格，都是观察世界的另一种方式。'
              : '灵感不止于此，也可以试试其他筛选条件。'
          }}
        </p></MotionTransition
      >
    </section>
    <ModalDialog v-model:open="drawer" label="筛选档案" kind="filter-dialog"
      ><div class="drawer-header">
        <h2>筛选风格</h2>
        <button class="icon-button" aria-label="取消筛选" @click="drawer = false"><X /></button>
      </div>
      <div class="drawer-body"><FilterPanel v-model="draft" :items="base" /></div>
      <div class="drawer-footer">
        <button
          class="text-button"
          @click="draft = { ...emptyFilters(favorites), q: draft.q, sort: draft.sort }"
        >
          重置</button
        ><button class="primary-button" @click="applyDraft">查看 {{ draftCount }} 个结果</button>
      </div></ModalDialog
    >
  </div>
</template>
