// 路由滚动等待新页面挂载，而不是用固定延时猜测动画何时结束。
let pending: Promise<void> | undefined
let resolve: (() => void) | undefined
export function beginPageLeave() {
  if (!pending)
    pending = new Promise<void>((done) => {
      resolve = done
    })
}
export function finishPageLeave() {
  resolve?.()
  pending = undefined
  resolve = undefined
}
export async function waitForPage() {
  await pending
}
