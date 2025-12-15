// bridge.ts: Executes once during application initialization
import { useZoneStore } from './zone-store'
import { getGraphStore } from './graph-registry'

// 1) After persistence is restored, perform alignment or state sync
useZoneStore.persist?.onFinishHydration?.((state) => {
  if (state.selectedId) {
    const s = getGraphStore(state.selectedId)
    // For example: mark the current activity, or perform a derived calculation

  }
})

// 2) Listen for changes in selectedId to switch the current GraphStore state
useZoneStore.subscribe(
  (s) => s.selectedId,
  (next, prev) => {
    if (prev && prev !== next) {
      const prevStore = getGraphStore(prev)
      // Optionally: handle cleanup or state saving for the previous store here
    }
    if (next) {
      const curStore = getGraphStore(next)
      // If certain actions need to be performed after persistence is complete
      curStore.persist?.onFinishHydration?.(() => {
        // For example: read form values or perform validation
        // const values = curStore.getState().getFormValues()
      })
    }
  }
)