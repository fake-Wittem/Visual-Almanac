<script setup lang="ts">
import { Bookmark, BookOpen, X } from '@lucide/vue'
import { useFavorites } from '../composables/useFavorites'
import { toast } from '../composables/useToast'
import BackToTop from '../components/common/BackToTop.vue'
import MotionTransition from '../components/motion/MotionTransition.vue'
import { beginPageLeave, finishPageLeave } from './pageMotion'
const { count, persistent } = useFavorites()
function runToastAction() {
  toast.value?.action?.()
  toast.value = null
}
</script>
<template>
  <a href="#main" class="skip-link">跳到主要内容</a>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" aria-label="Visual Almanac 首页"
        ><BookOpen :size="25" :stroke-width="1.4" /><span
          >Visual Almanac<small>视觉风格档案馆</small></span
        ></RouterLink
      >
      <nav aria-label="主导航">
        <RouterLink to="/" :class="{ active: $route.path === '/' }">全部档案</RouterLink
        ><RouterLink to="/favorites" :class="{ active: $route.path === '/favorites' }"
          ><Bookmark :size="16" /> 我的收藏 <span class="nav-count">{{ count }}</span></RouterLink
        >
      </nav>
      <span class="header-note">A PERSONAL ARCHIVE OF AESTHETICS</span>
    </div>
  </header>
  <div v-if="!persistent" class="storage-warning" role="status">
    收藏暂时无法保存，关闭页面后可能丢失。
  </div>
  <main id="main">
    <RouterView v-slot="{ Component, route }">
      <MotionTransition
        preset="page"
        mode="out-in"
        appear
        @before-leave="beginPageLeave"
        @before-enter="finishPageLeave"
        @leave-cancelled="finishPageLeave"
      >
        <div v-if="Component" :key="route.path" class="route-page">
          <component :is="Component" />
        </div>
      </MotionTransition>
    </RouterView>
  </main>
  <BackToTop />
  <footer class="site-footer">
    <span>Visual Almanac <span class="footer-dot">·</span> 收集审美，记录灵感。</span
    ><span>用颜色与图像，建立自己的视觉语言。</span>
  </footer>
  <MotionTransition preset="popup">
    <div v-if="toast" :key="toast.message" class="toast" role="status" aria-live="polite">
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
      />
    </div>
  </MotionTransition>
</template>
