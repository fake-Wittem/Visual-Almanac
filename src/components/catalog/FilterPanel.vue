<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ChevronDown } from '@lucide/vue'
import MotionLayout from '../motion/MotionLayout.vue'
import MotionList from '../motion/MotionList.vue'
import { categories } from '../../content/categories'
import { tags } from '../../content/tags'
import { dimensions, dimensionNames, type Dimension, type Style } from '../../content/schema'
import type { Filters } from '../../domain/catalog'
const props = defineProps<{ modelValue: Filters; items: readonly Style[] }>()
const emit = defineEmits<{ 'update:modelValue': [Filters] }>()
const expanded = reactive<Record<string, boolean>>({})
const available = computed(() => new Set(props.items.flatMap((s) => s.tags)))
const options = (d: Dimension) => tags.filter((t) => t.dimension === d && available.value.has(t.id))
function toggle(d: Dimension, id: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [d]: props.modelValue[d].includes(id)
      ? props.modelValue[d].filter((x) => x !== id)
      : [...props.modelValue[d], id],
    page: 1,
  })
}
</script>
<template>
  <div class="filter-panel">
    <div class="filter-intro"><span class="eyebrow">EXPLORE BY</span><span>探索风格</span></div>
    <fieldset>
      <legend>风格分类</legend>
      <button
        type="button"
        class="category-option"
        :class="{ selected: !modelValue.category }"
        @click="emit('update:modelValue', { ...modelValue, category: '', page: 1 })"
      >
        全部风格 <span>{{ items.length }}</span></button
      ><button
        v-for="c in categories.filter((c) => items.some((s) => s.category === c.id))"
        :key="c.id"
        type="button"
        class="category-option"
        :class="{ selected: modelValue.category === c.id }"
        :aria-pressed="modelValue.category === c.id"
        @click="emit('update:modelValue', { ...modelValue, category: c.id, page: 1 })"
      >
        {{ c.name }}<span>{{ items.filter((s) => s.category === c.id).length }}</span>
      </button>
    </fieldset>
    <fieldset v-for="d in dimensions" :key="d" v-show="options(d).length">
      <legend>{{ dimensionNames[d] }}</legend>
      <MotionLayout
        ><MotionList :class="d === 'color' ? 'color-options' : 'tag-options'">
          <button
            v-for="tag in options(d).slice(0, expanded[d] ? undefined : 6)"
            :key="tag.id"
            type="button"
            :class="{ selected: modelValue[d].includes(tag.id) }"
            :aria-pressed="modelValue[d].includes(tag.id)"
            @click="toggle(d, tag.id)"
          >
            <span v-if="tag.color" class="color-dot" :style="{ background: tag.color }" />{{
              tag.name
            }}
          </button>
        </MotionList></MotionLayout
      >
      <button
        v-if="options(d).length > 6"
        class="expand-filter"
        :aria-expanded="!!expanded[d]"
        @click="expanded[d] = !expanded[d]"
      >
        {{ expanded[d] ? '收起' : '展开更多'
        }}<ChevronDown :size="13" :class="{ rotate: expanded[d] }" />
      </button>
    </fieldset>
    <p class="filter-footnote">找到一种氛围，<br />开启下一次创作。</p>
  </div>
</template>
