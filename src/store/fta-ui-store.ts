// src/store/fta-ui-store.ts
import { create } from 'zustand';

type State = {
  preferred: Record<string /* zoneId */, string /* taskId */>;
  setPreferred: (zoneId: string, taskId: string) => void;
};

export const useFtaUiStore = create<State>((set) => ({
  preferred: {},
  setPreferred: (zoneId, taskId) =>
    set((s) => ({ preferred: { ...s.preferred, [zoneId]: taskId } })),
}));