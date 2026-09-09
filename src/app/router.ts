import { createRouter, createWebHistory } from 'vue-router'
import CatalogPage from '../pages/CatalogPage.vue'
import { navigation } from './navigation'
import { nextTick } from 'vue'
import { waitForPage } from './pageMotion'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: CatalogPage },
    { path: '/favorites', component: CatalogPage },
    { path: '/styles/:id', component: () => import('../pages/StyleDetailPage.vue'), props: true },
    { path: '/:pathMatch(.*)*', component: () => import('../pages/NotFoundPage.vue') },
  ],
  async scrollBehavior(to, from, saved) {
    if (to.path !== from.path) {
      await waitForPage()
      await nextTick()
    }
    if (saved) return saved
    if (to.path === from.path) return false
    if (from.path.startsWith('/styles/') && to.fullPath === navigation.listing)
      return { top: navigation.scroll }
    return { top: 0 }
  },
})
router.beforeEach((to, from) => {
  if ((from.path === '/' || from.path === '/favorites') && to.path.startsWith('/styles/')) {
    navigation.listing = from.fullPath
    navigation.scroll = window.scrollY
  }
})
