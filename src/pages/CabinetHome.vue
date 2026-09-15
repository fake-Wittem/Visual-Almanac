<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight, ArrowDown, BookOpen } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { collections } from '../components/cabinet/collections'
import { catalog } from '../repositories/catalog'

const router = useRouter()
const archiveCount = catalog.list().length
const collectionCounts = new Map<string, number>()
for (const archive of catalog.list()) {
  collectionCounts.set(archive.category, (collectionCounts.get(archive.category) ?? 0) + 1)
}
const active = ref(1)
const current = computed(() => collections[active.value]!)
const section = ref<HTMLElement>()
const progress = ref(0)
const reduced = ref(false)
const compact = ref(false)
const opening = ref(false)
const departing = ref<
  Record<
    number,
    { '--exit-x': string; '--exit-y': string; '--exit-scale': number; '--exit-depth': number }
  >
>({})
const departureTimers = new Map<number, ReturnType<typeof setTimeout>>()
let startX = 0
let startY = 0
let openingTimer: ReturnType<typeof setTimeout> | undefined
let frame = 0
let observer: IntersectionObserver | undefined
let media: MediaQueryList | undefined
let compactMedia: MediaQueryList | undefined
let lastWheel = 0
const syncMotion = () => {
  reduced.value = !!media?.matches
  if (reduced.value) {
    progress.value = 0
    clearDepartures()
  }
}
const syncCompact = () => {
  compact.value = !!compactMedia?.matches
  clearDepartures()
}
const hidden = (index: number) => offset(index) < -1 || offset(index) > (compact.value ? 1 : 2)

function clearDepartures() {
  departureTimers.forEach(clearTimeout)
  departureTimers.clear()
  departing.value = {}
}

function offset(index: number) {
  let d = (index - active.value + collections.length) % collections.length
  if (d >= collections.length - 2) d -= collections.length
  return d
}
function select(index: number) {
  if (opening.value) return
  const next = (index + collections.length) % collections.length
  if (next === active.value) return
  const previousSlots = collections.map((_, i) => offset(i))
  active.value = next
  collections.forEach((_, i) => {
    if (!hidden(i)) {
      clearTimeout(departureTimers.get(i))
      departureTimers.delete(i)
      delete departing.value[i]
      return
    }
    const slot = previousSlots[i]!
    if (reduced.value || slot < -1 || slot > (compact.value ? 1 : 2)) return
    clearTimeout(departureTimers.get(i))
    // Keep the outgoing sheet rendered at its old depth until its exit finishes.
    departing.value[i] = {
      '--exit-x':
        slot <= 0 ? (compact.value ? '-85cqw' : '-27cqw') : compact.value ? '90cqw' : '68cqw',
      '--exit-y': compact.value ? '8cqw' : '6cqw',
      '--exit-scale': compact.value ? 0.8 : 0.82,
      '--exit-depth': slot === 0 ? 20 : slot === -1 ? 10 : slot === 1 ? 7 : 6,
    }
    departureTimers.set(
      i,
      setTimeout(() => {
        delete departing.value[i]
        departureTimers.delete(i)
      }, 500),
    )
  })
}
function openCollection() {
  if (opening.value) return
  opening.value = true
  openingTimer = setTimeout(
    () => {
      void router.push({ path: '/catalog', query: { category: current.value.id } })
    },
    reduced.value ? 0 : 430,
  )
}
function key(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    select(active.value + (event.key === 'ArrowRight' ? 1 : -1))
  }
}
function touchStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  startX = touch.clientX
  startY = touch.clientY
}
function touchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (!touch) return
  const dx = touch.clientX - startX,
    dy = touch.clientY - startY
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4)
    select(active.value + (dx < 0 ? 1 : -1))
}
function wheel(event: WheelEvent) {
  if (Math.abs(event.deltaX) < 8 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
  event.preventDefault()
  if (performance.now() - lastWheel < 650) return
  lastWheel = performance.now()
  select(active.value + (event.deltaX > 0 ? 1 : -1))
}
function scroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    progress.value = reduced.value
      ? 0
      : Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
    frame = 0
  })
}
onMounted(() => {
  document.title = '序厅 · Visual Almanac'
  media = matchMedia('(prefers-reduced-motion: reduce)')
  syncMotion()
  media.addEventListener('change', syncMotion)
  compactMedia = matchMedia('(max-width: 680px)')
  syncCompact()
  compactMedia.addEventListener('change', syncCompact)
  window.addEventListener('scroll', scroll, { passive: true })
  observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      }),
    { threshold: 0.12 },
  )
  section.value?.querySelectorAll('.reveal').forEach((item) => observer?.observe(item))
  scroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scroll)
  media?.removeEventListener('change', syncMotion)
  compactMedia?.removeEventListener('change', syncCompact)
  cancelAnimationFrame(frame)
  clearTimeout(openingTimer)
  clearDepartures()
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="section"
    class="cabinet-home"
    :class="{ 'is-opening': opening }"
    :style="{ '--scroll': progress }"
  >
    <section class="entrance" aria-labelledby="entrance-title">
      <div class="entrance-heading">
        <p class="cabinet-kicker">THE COLLECTOR’S CABINET</p>
        <h1 id="entrance-title">打开一册，发现一种世界。</h1>
        <p class="entrance-subtitle">风格是时代的物证，也是个人的收藏。</p>
        <span class="ornament" aria-hidden="true">—</span>
      </div>
      <div
        class="cabinet-stage"
        role="region"
        aria-roledescription="轮播"
        aria-label="风格档案袋，使用左右方向键翻阅"
        tabindex="0"
        @keydown="key"
        @wheel="wheel"
        @touchstart.passive="touchStart"
        @touchend.passive="touchEnd"
      >
        <article
          v-for="(collection, i) in collections"
          :key="collection.id"
          class="archive-folder"
          :class="{ selected: i === active, 'is-departing': !!departing[i] }"
          :style="departing[i]"
          :data-position="offset(i)"
          :aria-hidden="hidden(i) || undefined"
          :inert="hidden(i)"
        >
          <img
            class="folder-material"
            src="/images/cabinet/folder-blank.webp"
            alt=""
            draggable="false"
          />
          <button
            v-if="i !== active"
            class="folder-select"
            :aria-label="`翻阅${collection.name}档案袋`"
            @click="select(i)"
          />
          <span class="folder-number">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="folder-title">
            <h2>{{ collection.name }}</h2>
            <p>{{ collection.englishName }}</p>
          </div>
          <span class="folder-motto">{{ collection.motto }}</span>
          <img
            class="folder-art"
            :src="collection.image"
            :alt="`${collection.name}视觉作品`"
            draggable="false"
            :fetchpriority="i === 1 ? 'high' : 'auto'"
          />
          <p class="folder-description">{{ collection.description }}</p>
          <div class="folder-bottom">
            <span>{{ String(i + 1).padStart(2, '0') }} / 08</span>
            <button v-if="i === active" class="brass-button" @click="openCollection">
              打开档案 <ArrowRight :size="16" :stroke-width="1.3" />
            </button>
            <span>VISUAL ALMANAC</span>
          </div>
        </article>
        <button
          class="cabinet-arrow previous"
          aria-label="翻阅上一个档案袋"
          @click="select(active - 1)"
        >
          <ArrowLeft :size="25" :stroke-width="1.2" />
        </button>
        <button
          class="cabinet-arrow next"
          aria-label="翻阅下一个档案袋"
          @click="select(active + 1)"
        >
          <ArrowRight :size="25" :stroke-width="1.2" />
        </button>
      </div>
      <div class="cabinet-ruler">
        <span>01</span>
        <div class="ruler-track" role="group" aria-label="选择档案袋">
          <button
            v-for="(collection, i) in collections"
            :key="collection.id"
            :class="{ active: active === i }"
            :aria-label="collection.name"
            :aria-pressed="active === i"
            @click="select(i)"
          >
            <span />
          </button>
        </div>
        <button
          class="scroll-caption"
          @click="
            section
              ?.querySelector('#collection-index')
              ?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })
          "
        >
          翻阅风格，收藏灵感 <ArrowDown :size="13" />
        </button>
        <span>08</span>
      </div>
      <p class="sr-only" aria-live="polite">
        当前档案袋：{{ current.name }}，第 {{ active + 1 }} 个，共 8 个。
      </p>
    </section>

    <div class="entrance-colophon">
      <span>Visual Almanac <small>视觉风格档案馆</small></span
      ><span>收集风格，记录灵感，留存一个更美的世界。</span>
    </div>
    <section id="collection-index" class="collection-index cabinet-width">
      <div class="index-intro reveal">
        <div>
          <p class="cabinet-kicker">A FIELD GUIDE TO AESTHETICS</p>
          <h2>每一种风格，<br />都有值得细看的世界。</h2>
        </div>
        <p>
          从图像、色彩到设计的来处，<br />沿着好奇心，建立自己的视觉词典。<br /><RouterLink
            to="/catalog"
            >浏览全部 {{ archiveCount }} 份档案 <ArrowRight :size="17"
          /></RouterLink>
        </p>
      </div>
      <div class="collection-directory">
        <RouterLink
          v-for="(collection, i) in collections"
          :key="collection.id"
          class="directory-row reveal"
          :to="{ path: '/catalog', query: { category: collection.id } }"
        >
          <span class="directory-number">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3>{{ collection.name }}</h3>
          <span class="directory-english">{{ collection.englishName }}</span
          ><span class="directory-count">{{ collectionCounts.get(collection.id) ?? 0 }} 份档案</span
          ><ArrowRight :size="21" /><img :src="collection.image" alt="" loading="lazy" />
        </RouterLink>
      </div>
      <div class="collection-closing reveal">
        <BookOpen :size="32" :stroke-width="1" />
        <p>审美，始于一次认真观看。</p>
        <RouterLink to="/favorites">打开我的收藏 <ArrowRight :size="15" /></RouterLink>
      </div>
    </section>
  </div>
</template>
