<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowUpRight } from '@lucide/vue'
import { catalog, assetById } from '../repositories/catalog'
import { categories } from '../content/categories'
import { tags } from '../content/tags'
import { relatedStyles } from '../domain/related'
import { navigation } from '../app/navigation'
import FavoriteButton from '../components/common/FavoriteButton.vue'
import ReferenceGallery from '../components/media/ReferenceGallery.vue'
import PalettePanel from '../components/palette/PalettePanel.vue'
import StyleCard from '../components/catalog/StyleCard.vue'
import NotFoundPage from './NotFoundPage.vue'
const route = useRoute()
const style = computed(() => catalog.get(String(route.params.id)))
const related = computed(() => (style.value ? relatedStyles(style.value, catalog.list()) : []))
watch(
  style,
  (s) => {
    document.title = `${s?.name || '档案未找到'} · Visual Almanac`
  },
  { immediate: true },
)
</script>
<template>
  <div v-if="style" class="detail-page page-width">
    <div class="detail-breadcrumb">
      <RouterLink :to="navigation.listing"><ArrowLeft :size="16" />返回档案</RouterLink
      ><span>/</span
      ><RouterLink :to="{ path: '/', query: { category: style.category } }">{{
        categories.find((c) => c.id === style?.category)?.name
      }}</RouterLink
      ><span>/</span><span>{{ style.name }}</span>
    </div>
    <div class="detail-main">
      <ReferenceGallery :style="style" />
      <div class="detail-info">
        <p class="eyebrow">{{ style.englishName }}</p>
        <div class="detail-title">
          <h1>{{ style.name }}</h1>
          <FavoriteButton :id="style.id" :name="style.name" />
        </div>
        <p class="detail-summary">{{ style.summary }}</p>
        <div class="detail-tags">
          <RouterLink
            v-for="id in style.tags"
            :key="id"
            :to="{ path: '/', query: { [tags.find((t) => t.id === id)!.dimension]: id } }"
            >{{ tags.find((t) => t.id === id)?.name }}</RouterLink
          >
        </div>
        <PalettePanel :palettes="style.palettes" :style-id="style.id" />
      </div>
    </div>
    <section v-if="style.notes.length" class="design-notes">
      <div class="section-heading">
        <div>
          <p class="eyebrow">DESIGN NOTES</p>
          <h2>读懂一种视觉语言</h2>
        </div>
        <span>基于参考图的观察与整理</span>
      </div>
      <div class="notes-grid">
        <article v-for="(n, i) in style.notes" :key="n.title">
          <span class="note-index">0{{ i + 1 }}</span>
          <h3>{{ n.title }}</h3>
          <p>{{ n.body }}</p>
        </article>
      </div>
    </section>
    <section v-if="style.applications.length" class="application-notes">
      <p class="eyebrow">IN PRACTICE</p>
      <h2>如何带进你的设计</h2>
      <p v-for="(a, i) in style.applications" :key="i">{{ a }}</p>
    </section>
    <section v-if="style.practice.length" class="application-notes">
      <h2>实践记录</h2>
      <p v-for="(p, i) in style.practice" :key="i">{{ p }}</p>
    </section>
    <section class="source-note">
      <span class="eyebrow">REFERENCE</span>
      <p v-for="im in style.images" :key="im.asset">{{ assetById(im.asset).source }}</p>
      <span>档案更新于 {{ style.updatedAt }}</span>
    </section>
    <section v-if="related.length" class="related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">KEEP EXPLORING</p>
          <h2>也许，你还会喜欢</h2>
        </div>
        <RouterLink to="/">浏览全部 <ArrowUpRight :size="15" /></RouterLink>
      </div>
      <div class="style-grid related-grid">
        <StyleCard v-for="r in related" :key="r.style.id" :style="r.style" :reason="r.reason" />
      </div>
    </section>
  </div>
  <NotFoundPage v-else />
</template>
