import { notify } from './useToast'
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify('已复制到剪贴板')
  } catch {
    notify('自动复制不可用，请选择下方文本复制。', undefined, text)
  }
}
