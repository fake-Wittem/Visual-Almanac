import { createRouter, createWebHistory } from 'vue-router'
import { navigation } from './navigation'
import { nextTick } from 'vue'
import { waitForPage } from './pageMotion'
const CatalogPage = () => import('../pages/CatalogPage.vue')

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../pages/CabinetHome.vue'),
      beforeEnter: (to) =>
        Object.keys(to.query).length ? { path: '/catalog', query: to.query, replace: true } : true,
    },
    { path: '/catalog', component: CatalogPage },
    { path: '/favorites', component: CatalogPage },
    { path: '/styles/:id', component: () => import('../pages/StyleDetailPage.vue'), props: true },
    { path: '/:pathMatch(.*)*', component: () => import('../pages/NotFoundPage.vue') },
  ],
  async scrollBehavior(to, from, saved) {
    if (to.path !== from.path) {
      await waitForPage()
      await nextTick()
    }
    if (saved) return { ...saved, behavior: 'instant' }
    if (to.path === from.path) return false
    if (from.path.startsWith('/styles/') && to.fullPath === navigation.listing)
      return { top: navigation.scroll, behavior: 'instant' }
    return { top: 0, behavior: 'instant' }
  },
})
router.beforeEach((to, from) => {
  if ((from.path === '/catalog' || from.path === '/favorites') && to.path.startsWith('/styles/')) {
    navigation.listing = from.fullPath
    navigation.scroll = window.scrollY
  }
})
