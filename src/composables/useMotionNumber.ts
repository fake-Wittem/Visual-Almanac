import { onBeforeUnmount, onMounted, readonly, ref, watch, type Ref } from 'vue'

// 从当前显示值重新起步，连续操作不会排队，也不会跳回上一次起点。
export function useMotionNumber(target: Ref<number>) {
  const value = ref(target.value)
  let frame = 0
  let media: MediaQueryList | undefined
  function stop() {
    cancelAnimationFrame(frame)
  }
  function snap() {
    stop()
    value.value = target.value
  }
  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', snap)
  })
  watch(target, (to) => {
    stop()
    if (media?.matches) return snap()
    const from = value.value
    const duration = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--motion-layout-duration'),
    )
    if (!duration) return snap()
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      value.value = from + (to - from) * (1 - Math.pow(1 - progress, 3))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  })
  onBeforeUnmount(() => {
    stop()
    media?.removeEventListener('change', snap)
  })
  return readonly(value)
}
