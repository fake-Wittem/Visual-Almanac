<script setup lang="ts">
import { useId } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import type { DesignHistory } from '../../content/schema'
const props = defineProps<{ history: DesignHistory }>()
const id = useId()
const sourceNumber = (sourceId: string) =>
  props.history.sources.findIndex((source) => source.id === sourceId) + 1
</script>
<template>
  <section class="design-history" :aria-labelledby="`${id}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">REFERENCE</p>
        <h2 :id="`${id}-title`">设计史：从起源到演变</h2>
      </div>
      <span>时间、观念与视觉语言</span>
    </div>
    <p class="history-overview">{{ history.overview }}</p>
    <div class="history-layout">
      <ol class="history-timeline" aria-label="风格发展时间线">
        <li v-for="(entry, index) in history.timeline" :key="`${entry.year}-${entry.title}`">
          <div class="history-period">
            <span class="history-index">{{ String(index + 1).padStart(2, '0') }}</span
            ><span>{{ entry.period }}</span>
          </div>
          <div class="history-event">
            <h3>{{ entry.title }}</h3>
            <p>{{ entry.body }}</p>
            <div class="history-citations" aria-label="本阶段参考资料">
              <a
                v-for="sourceId in entry.sourceIds"
                :key="sourceId"
                :href="`#${id}-source-${sourceId}`"
                :aria-label="`查看参考资料 ${sourceNumber(sourceId)}`"
                >[{{ sourceNumber(sourceId) }}]</a
              >
            </div>
          </div>
        </li>
      </ol>
      <aside class="history-reading" :aria-labelledby="`${id}-sources`">
        <p class="eyebrow">FURTHER READING</p>
        <h3 :id="`${id}-sources`">参考资料</h3>
        <ol>
          <li
            v-for="(source, index) in history.sources"
            :id="`${id}-source-${source.id}`"
            :key="source.id"
            tabindex="-1"
          >
            <span class="history-source-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <span class="history-publisher">{{ source.publisher }}</span>
              <a :href="source.url" target="_blank" rel="noopener noreferrer"
                >{{ source.title }}<ArrowUpRight :size="13" aria-hidden="true" /><span
                  class="sr-only"
                  >（在新标签页打开）</span
                ></a
              >
            </div>
          </li>
        </ol>
      </aside>
    </div>
    <div class="history-interpretation">
      <h3>回到这份风格档案</h3>
      <p>{{ history.interpretation }}</p>
    </div>
    <div class="history-provenance"><slot /></div>
  </section>
</template>
