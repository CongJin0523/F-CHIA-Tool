// bridge.ts：在应用初始化时执行一次
import { useZoneStore } from './zone-store'
import { getGraphStore } from './graph-registry'

// 1) 等持久化恢复后再做一次对齐
useZoneStore.persist?.onFinishHydration?.((state) => {
  if (state.selectedId) {
    const s = getGraphStore(state.selectedId)
    // 例如：标记当前活动，或做一次衍生计算

  }
})

// 2) 监听 selectedId 变化，切换当前 GraphStore 的状态
useZoneStore.subscribe(
  (s) => s.selectedId,
  (next, prev) => {
    if (prev && prev !== next) {
      const prevStore = getGraphStore(prev)
     
    }
    if (next) {
      const curStore = getGraphStore(next)
      
      // 如果需要等持久化完成后再做某些动作
      curStore.persist?.onFinishHydration?.(() => {
        // e.g. 读取 getFormValues / 做一次校验
        // const values = curStore.getState().getFormValues()
      })
    }
  }
)