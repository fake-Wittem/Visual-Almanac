<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  List,
} from '@lucide/vue'
import { catalog } from '../repositories/catalog'
import { tags } from '../content/tags'
import { categories } from '../content/categories'
import { dimensions } from '../content/schema'
import { emptyFilters, filterStyles, sortStyles, pageStyles, type Filters } from '../domain/catalog'
import { useCatalogQuery } from '../composables/useCatalogQuery'
import { useFavorites } from '../composables/useFavorites'
import ArchiveRecord from '../components/cabinet/ArchiveRecord.vue'
import { collections } from '../components/cabinet/collections'
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
const { favorites, filters, apply: applyQuery } = useCatalogQuery(),
  { has, saved } = useFavorites()
const collection = computed(() => collections.find((c) => c.id === filters.value.category))
const layout = ref('grid')
const base = computed(() => catalog.list().filter((s) => !favorites.value || has(s.id)))
const results = computed(() =>
  sortStyles(filterStyles(base.value, filters.value), filters.value.sort, saved.value),
)
const pagination = computed(() => pageStyles(results.value, filters.value.page))
const search = ref(filters.value.q),
  composing = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
function apply(value: Filters, replace = false) {
  clearTimeout(searchTimer)
  searchTimer = undefined
  return applyQuery(value, replace)
}
watch(
  () => filters.value.q,
  (v) => {
    if (!searchTimer) search.value = v
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
  searchTimer = undefined
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
  <div
    class="catalog-layout cabinet-catalog cabinet-width"
    :class="{ 'catalog-list-view': layout === 'list' }"
  >
    <section class="catalog-content">
      <RouterLink class="catalog-back" to="/"><ArrowLeft :size="14" /> 返回序厅</RouterLink>
      <div class="catalog-heading">
        <div>
          <p class="eyebrow">
            {{ favorites ? 'YOUR PERSONAL COLLECTION' : 'THE VISUAL ARCHIVE'
            }}<span class="eyebrow-line" />
          </p>
          <h1>
            {{
              favorites
                ? '我的私人收藏。'
                : collection
                  ? collection.name + '。'
                  : '风格，有迹可循。'
            }}
          </h1>
          <p class="page-description">
            {{
              favorites
                ? '收藏保存在当前浏览器中，随时回来重拾灵感。'
                : collection?.description ||
                  '八个章节，无数种观看世界的方式。打开一份档案，开始你的探索。'
            }}
          </p>
        </div>
        <span class="archive-count"
          ><b>{{ String(results.length).padStart(2, '0') }}</b
          ><span>{{ favorites ? '份收藏' : '份风格档案' }}</span></span
        >
      </div>
      <nav class="catalog-chapters" aria-label="档案分类">
        <button
          :class="{ selected: !filters.category }"
          :aria-pressed="!filters.category"
          @click="apply({ ...filters, category: '', page: 1 })"
        >
          全部馆藏
        </button>
        <button
          v-for="c in collections"
          :key="c.id"
          :class="{ selected: filters.category === c.id }"
          :aria-pressed="filters.category === c.id"
          @click="apply({ ...filters, category: c.id, page: 1 })"
        >
          {{ c.name }}
        </button>
      </nav>
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
              <X :size="16" /></button
          ></MotionTransition>
        </form>
        <button class="cabinet-filter-button" @click="openFilters">
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
        >
        <div class="catalog-view-switch" aria-label="展示方式">
          <button aria-label="展柜视图" :aria-pressed="layout === 'grid'" @click="layout = 'grid'">
            <LayoutGrid :size="17" /></button
          ><button aria-label="目录视图" :aria-pressed="layout === 'list'" @click="layout = 'list'">
            <List :size="19" />
          </button>
        </div>
      </div>
      <MotionLayout
        ><MotionList class="style-grid cabinet-records">
          <ArchiveRecord v-for="(s, i) in pagination.items" :key="s.id" :style="s" :eager="i < 3" />
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
            ><RouterLink v-if="favorites && !base.length" class="primary-button" to="/catalog"
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
