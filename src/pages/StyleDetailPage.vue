<script setup lang="ts">
import { computed, watch } from 'vue'
import { ArrowLeft, ArrowUpRight, ArrowRight } from '@lucide/vue'
import { catalog, assetById } from '../repositories/catalog'
import { categories } from '../content/categories'
import { tags } from '../content/tags'
import { relatedStyles } from '../domain/related'
import { navigation } from '../app/navigation'
import FavoriteButton from '../components/common/FavoriteButton.vue'
import ReferenceGallery from '../components/media/ReferenceGallery.vue'
import PalettePanel from '../components/palette/PalettePanel.vue'
import ArchiveRecord from '../components/cabinet/ArchiveRecord.vue'
import NotFoundPage from './NotFoundPage.vue'
import DesignHistory from '../components/history/DesignHistory.vue'
const props = defineProps<{ id: string }>()
const style = computed(() => catalog.get(props.id))
const related = computed(() => (style.value ? relatedStyles(style.value, catalog.list()) : []))
const nextStyle = computed(() => {
  const all = catalog.list()
  return all[(all.findIndex((s) => s.id === props.id) + 1) % all.length]
})
watch(
  style,
  (s) => {
    document.title = `${s?.name || '档案未找到'} · Visual Almanac`
  },
  { immediate: true },
)
</script>
<template>
  <div v-if="style" class="detail-page cabinet-detail cabinet-width">
    <div class="detail-breadcrumb">
      <RouterLink :to="navigation.listing"><ArrowLeft :size="16" />返回档案</RouterLink
      ><span>/</span
      ><RouterLink :to="{ path: '/catalog', query: { category: style.category } }">{{
        categories.find((c) => c.id === style?.category)?.name
      }}</RouterLink
      ><span>/</span><span>{{ style.name }}</span>
    </div>
    <header class="dossier-heading">
      <div>
        <p class="cabinet-kicker">
          THE VISUAL ARCHIVE · NO. {{ String(style.order).padStart(3, '0') }}
        </p>
        <h1>{{ style.name }}</h1>
        <p class="dossier-english">{{ style.englishName }}</p>
      </div>
      <FavoriteButton :id="style.id" :name="style.name" labeled />
    </header>
    <nav class="dossier-tabs" aria-label="档案章节">
      <a href="#reference">01 图像与配色</a><a href="#observations">02 设计观察</a
      ><a href="#history">03 风格溯源</a
      ><RouterLink v-if="nextStyle" :to="`/styles/${nextStyle.id}`"
        >下一份档案 <ArrowRight :size="15"
      /></RouterLink>
    </nav>
    <div id="reference" class="detail-main dossier-sheet">
      <ReferenceGallery :style="style" />
      <div class="detail-info">
        <p class="cabinet-kicker">A CLOSER LOOK</p>
        <h2 class="dossier-section-title">一种风格的视觉语言。</h2>
        <p class="detail-summary">{{ style.summary }}</p>
        <div class="detail-tags">
          <RouterLink
            v-for="id in style.tags"
            :key="id"
            :to="{ path: '/catalog', query: { [tags.find((t) => t.id === id)!.dimension]: id } }"
            >{{ tags.find((t) => t.id === id)?.name }}</RouterLink
          >
        </div>
        <PalettePanel :palettes="style.palettes" :style-id="style.id" />
      </div>
    </div>
    <section v-if="style.notes.length" id="observations" class="design-notes">
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
      <p class="eyebrow">DESIGN APPLICATION</p>
      <h2>如何带进你的设计</h2>
      <p v-for="(a, i) in style.applications" :key="i">{{ a }}</p>
    </section>
    <div id="history">
      <DesignHistory :history="style.designHistory">
        <p v-for="im in style.images" :key="im.asset">{{ assetById(im.asset).source }}</p>
        <span>档案更新于 {{ style.updatedAt }}</span>
      </DesignHistory>
    </div>
    <section v-if="related.length" class="related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">KEEP EXPLORING</p>
          <h2>也许，你还会喜欢</h2>
        </div>
        <RouterLink to="/catalog">浏览全部 <ArrowUpRight :size="15" /></RouterLink>
      </div>
      <div class="style-grid related-grid">
        <ArchiveRecord v-for="r in related" :key="r.style.id" :style="r.style" :reason="r.reason" />
      </div>
    </section>
  </div>
  <NotFoundPage v-else />
</template>
