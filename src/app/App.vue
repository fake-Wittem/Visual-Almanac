<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Search, X, ArrowUpRight, ArrowRight } from '@lucide/vue'
import { useFavorites } from '../composables/useFavorites'
import { toast } from '../composables/useToast'
import ModalDialog from '../components/common/ModalDialog.vue'
import BackToTop from '../components/common/BackToTop.vue'
import MotionTransition from '../components/motion/MotionTransition.vue'
import { beginPageLeave, finishPageLeave } from './pageMotion'
import { collections } from '../components/cabinet/collections'
import { catalog } from '../repositories/catalog'
const route = useRoute(),
  router = useRouter()
const { count, persistent } = useFavorites()
const indexOpen = ref(false),
  search = ref('')
const isHome = computed(() => route.path === '/')
const chapter = computed(() => (isHome.value ? 0 : route.path === '/favorites' ? 2 : 1))
watch(
  () => route.fullPath,
  () => {
    indexOpen.value = false
  },
)
function submitSearch() {
  void router.push({
    path: '/catalog',
    query: search.value.trim() ? { q: search.value.trim() } : {},
  })
  indexOpen.value = false
}
function runToastAction() {
  toast.value?.action?.()
  toast.value = null
}
</script>
<template>
  <a href="#main" class="skip-link">跳到主要内容</a>
  <header class="cabinet-header">
    <RouterLink to="/" class="cabinet-brand" aria-label="Visual Almanac 首页"
      ><BookOpen :size="36" :stroke-width="1.25" /><span
        >Visual Almanac<small>视觉风格档案馆</small></span
      ></RouterLink
    >
    <span class="brand-caption">A PERSONAL ARCHIVE<br />OF AESTHETICS</span>
    <button class="index-trigger" @click="indexOpen = true">
      <Search :size="23" :stroke-width="1.3" /><span>全馆索引</span>
    </button>
  </header>
  <nav class="edge-navigation" aria-label="主导航">
    <RouterLink
      to="/"
      :class="{ active: chapter === 0 }"
      :aria-current="chapter === 0 ? 'page' : undefined"
      ><span>序厅</span><i v-if="chapter === 0" aria-hidden="true"
    /></RouterLink>
    <RouterLink
      to="/catalog"
      :class="{ active: chapter === 1 }"
      :aria-current="chapter === 1 ? 'page' : undefined"
      ><span>档案</span><i v-if="chapter === 1" aria-hidden="true"
    /></RouterLink>
    <RouterLink
      to="/favorites"
      :class="{ active: chapter === 2 }"
      :aria-current="chapter === 2 ? 'page' : undefined"
      ><span>收藏</span><small v-if="count">{{ count }}</small
      ><i v-else-if="chapter === 2" aria-hidden="true"
    /></RouterLink>
  </nav>
  <div v-if="!persistent" class="storage-warning" role="status">
    收藏暂时无法保存，关闭页面后可能丢失。
  </div>
  <main id="main" tabindex="-1">
    <RouterView v-slot="{ Component, route: currentRoute }">
      <MotionTransition
        preset="page"
        mode="out-in"
        @before-leave="beginPageLeave"
        @before-enter="finishPageLeave"
        @leave-cancelled="finishPageLeave"
      >
        <div v-if="Component" :key="currentRoute.path" class="route-page">
          <component :is="Component" />
        </div>
      </MotionTransition>
    </RouterView>
  </main>
  <footer v-if="!isHome" class="cabinet-footer">
    <RouterLink to="/">Visual Almanac <small>视觉风格档案馆</small></RouterLink
    ><span>收集风格，记录灵感，留存一个更美的世界。</span>
  </footer>
  <BackToTop v-if="!indexOpen" />
  <ModalDialog v-model:open="indexOpen" label="全馆索引" kind="cabinet-index-dialog">
    <div class="index-dialog-top">
      <p class="cabinet-kicker">THE ARCHIVE DIRECTORY</p>
      <button class="icon-button" aria-label="关闭全馆索引" @click="indexOpen = false">
        <X :size="25" :stroke-width="1.2" />
      </button>
    </div>
    <h2>沿着好奇心，<br />找到下一份灵感。</h2>
    <form class="index-search" role="search" @submit.prevent="submitSearch">
      <Search :size="22" :stroke-width="1.3" /><input
        v-model="search"
        aria-label="搜索全馆档案"
        placeholder="搜索风格、颜色或关键词"
      /><button type="submit" aria-label="搜索"><ArrowRight :size="24" /></button>
    </form>
    <div class="index-destinations">
      <RouterLink to="/" @click="indexOpen = false"
        ><span>01</span> 序厅 <ArrowUpRight :size="18" /></RouterLink
      ><RouterLink to="/catalog" @click="indexOpen = false"
        ><span>02</span> 全部档案 <small>{{ catalog.list().length }}</small
        ><ArrowUpRight :size="18" /></RouterLink
      ><RouterLink to="/favorites" @click="indexOpen = false"
        ><span>03</span> 我的收藏 <small>{{ count }}</small
        ><ArrowUpRight :size="18"
      /></RouterLink>
    </div>
    <div class="index-categories">
      <RouterLink
        v-for="(c, i) in collections"
        :key="c.id"
        :to="{ path: '/catalog', query: { category: c.id } }"
        ><span>{{ String(i + 1).padStart(2, '0') }}</span
        >{{ c.name }}<ArrowRight :size="15"
      /></RouterLink>
    </div>
    <p class="index-dialog-note">风格是时代的物证，也是个人的收藏。</p>
  </ModalDialog>
  <MotionTransition preset="popup"
    ><div v-if="toast" :key="toast.message" class="toast" role="status" aria-live="polite">
      <div class="toast-message">
        {{ toast.message }}<button v-if="toast.action" @click="runToastAction">撤销</button
        ><button class="icon-button" aria-label="关闭提示" @click="toast = null">
          <X :size="16" />
        </button>
      </div>
      <textarea
        v-if="toast.fallback"
        aria-label="手动复制内容"
        readonly
        :value="toast.fallback"
        @focus="($event.target as HTMLTextAreaElement).select()"
      /></div
  ></MotionTransition>
</template>
