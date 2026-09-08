import { createRouter, createWebHistory } from 'vue-router'
import CatalogPage from '../pages/CatalogPage.vue'
import { navigation } from './navigation'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: CatalogPage },
    { path: '/favorites', component: CatalogPage },
    { path: '/styles/:id', component: () => import('../pages/StyleDetailPage.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('../pages/NotFoundPage.vue') },
  ],
  scrollBehavior(to, from, saved) {
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
