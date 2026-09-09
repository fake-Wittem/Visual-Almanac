<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import MotionTransition from '../motion/MotionTransition.vue'

const props = defineProps<{
  modelValue: string
  label: string
  options: { value: string; label: string }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const list = ref<HTMLElement>()
const open = ref(false)
const above = ref(false)
const active = ref(0)
const selected = computed(() => props.options.find((option) => option.value === props.modelValue))
async function show() {
  active.value = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  )
  const bounds = trigger.value?.getBoundingClientRect()
  above.value = !!bounds && window.innerHeight - bounds.bottom < 240 && bounds.top > 240
  open.value = true
  await nextTick()
  list.value?.focus()
}
function close(restore = false) {
  open.value = false
  if (restore) trigger.value?.focus()
}
function choose(index: number) {
  const option = props.options[index]
  if (option) emit('update:modelValue', option.value)
  close(true)
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Tab') return close()
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    return close(true)
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    return choose(active.value)
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    const length = props.options.length
    if (!length) return
    active.value =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? length - 1
          : (active.value + (event.key === 'ArrowDown' ? 1 : -1) + length) % length
    document.getElementById(`${id}-${active.value}`)?.scrollIntoView({ block: 'nearest' })
  }
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>
<template>
  <div
    ref="root"
    class="sort-select"
    @focusout="!root?.contains($event.relatedTarget as Node) && close()"
  >
    <button
      ref="trigger"
      type="button"
      class="select-trigger"
      aria-haspopup="listbox"
      :aria-label="`${label}：${selected?.label || '请选择'}`"
      :aria-expanded="open"
      :aria-controls="id"
      @click="open ? close() : show()"
      @keydown.down.prevent="show()"
      @keydown.up.prevent="show()"
    >
      <span>{{ selected?.label || '请选择' }}</span
      ><ChevronDown :size="15" :class="{ rotate: open }" />
    </button>
    <MotionTransition preset="popup">
      <div v-if="open" class="select-popup" :class="{ 'opens-above': above }">
        <p class="select-caption">{{ label }}方式</p>
        <ul
          :id="id"
          ref="list"
          role="listbox"
          tabindex="-1"
          :aria-label="label"
          :aria-activedescendant="`${id}-${active}`"
          @keydown="keydown"
        >
          <li
            v-for="(option, index) in options"
            :id="`${id}-${index}`"
            :key="option.value"
            role="option"
            :aria-selected="option.value === modelValue"
            :class="{ 'is-active': active === index }"
            @pointermove="active = index"
            @mousedown.prevent
            @click="choose(index)"
          >
            <span>{{ option.label }}</span
            ><Check v-if="option.value === modelValue" :size="15" />
          </li>
        </ul>
      </div>
    </MotionTransition>
  </div>
</template>
