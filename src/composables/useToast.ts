import { shallowRef } from 'vue'
export const toast = shallowRef<{ message: string; action?: () => void; fallback?: string } | null>(
  null,
)
let timer: ReturnType<typeof setTimeout>
export function notify(message: string, action?: () => void, fallback?: string) {
  clearTimeout(timer)
  toast.value = { message, action, fallback }
  if (!fallback)
    timer = setTimeout(
      () => {
        toast.value = null
      },
      action ? 5000 : 2600,
    )
}
